/* =============================================================================
 * main.c  —  OBhai BLDC Controller
 * Target  :  STM32G431VBT6 (Cortex-M4 + FPU, 170 MHz)
 * Purpose :  USB CDC VCP protocol backend for OBhai BLDC GUI
 *
 * ── CubeMX peripheral config assumed ────────────────────────────────────────
 *  USB_FS    → USB_DEVICE, CDC class
 *  TIM6      → Basic timer, 100 ms overflow (used for 10 Hz telemetry)
 *  ADC1/2    → Phase currents Ia, Ib; Vbus; NTC temperature  (user wired)
 *  SysTick   → HAL timebase (1 ms)
 *  UART2     → Optional debug (not needed for GUI comms)
 *
 * ── Mandatory edit in usbd_cdc_if.c ────────────────────────────────────────
 *  1) In CDC_Receive_FS():
 *       extern void Protocol_OnReceive(uint8_t *buf, uint32_t len);
 *       Protocol_OnReceive(Buf, *Len);
 *       return (USBD_OK);
 *
 *  2) In CDC_Control_FS(), case USB_CDC_SET_CONTROL_LINE_STATE:
 *       extern void Protocol_OnDTR(uint8_t state);
 *       Protocol_OnDTR(pbuf[0] & 0x01);   // bit0 = DTR
 *       break;
 *
 * ── How it works ────────────────────────────────────────────────────────────
 *  - GUI opens port → asserts DTR → STM32 sends handshake string
 *  - GUI sends "ping\n" → same handshake response
 *  - GUI sends "r key\n" → STM32 replies "key=value\n"
 *  - GUI sends "w key value\n" → STM32 updates param, replies "OK\n"
 *  - TIM6 ISR fires every 100 ms → STM32 pushes "T key=value\n" telemetry
 * =============================================================================
 */

#include "main.h"
#include "usb_device.h"
#include "usbd_cdc_if.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* ─── Firmware / hardware version (shown in GUI header) ─────────────────── */
#define FW_VERSION   "1.0.0"
#define HW_VERSION   "v2"
#define HANDSHAKE_STR  "OBHAI_BLDC fw:" FW_VERSION " hw:" HW_VERSION "\n"

/* ─── Fault bitmask ─────────────────────────────────────────────────────── */
#define FAULT_OVERCURRENT     (1U << 0)
#define FAULT_OVERVOLTAGE     (1U << 1)
#define FAULT_UNDERVOLTAGE    (1U << 2)
#define FAULT_OVERTEMP        (1U << 3)
#define FAULT_ENCODER         (1U << 4)
#define FAULT_DRV             (1U << 5)
#define FAULT_WATCHDOG        (1U << 6)

/* ─── Control modes ─────────────────────────────────────────────────────── */
typedef enum {
    MODE_IDLE       = 0,
    MODE_VELOCITY   = 1,
    MODE_TORQUE     = 2,
    MODE_OPEN_LOOP  = 3,
} ControlMode_t;

/* ═══════════════════════════════════════════════════════════════════════════
 * Parameter store  (R/W from GUI)
 * ═══════════════════════════════════════════════════════════════════════════ */
typedef struct {
    /* Control */
    uint8_t       enable;
    ControlMode_t mode;
    float         vel_setpoint;       /* RPM   */
    float         torque_setpoint;    /* A     */
    float         vel_ramp_rate;      /* RPM/s */

    /* Velocity PID */
    float kp_vel;
    float ki_vel;

    /* D-axis current PID */
    float kp_curr_d;
    float ki_curr_d;

    /* Q-axis current PID */
    float kp_curr_q;
    float ki_curr_q;

    /* Motor parameters */
    uint8_t  pole_pairs;
    float    flux_linkage;     /* Wb  */
    uint16_t deadtime_ns;      /* ns  */
    uint16_t encoder_cpr;      /* counts per revolution */
    float    max_rpm;
    float    max_current;      /* A   */
} Params_t;

/* ═══════════════════════════════════════════════════════════════════════════
 * Live motor state  (written by motor ISRs / ADC, read by telemetry)
 * ═══════════════════════════════════════════════════════════════════════════ */
typedef struct {
    float    rpm;
    float    vbus;        /* V  */
    float    ibus;        /* A  */
    float    ia;          /* A  */
    float    ib;          /* A  */
    float    id;          /* A — d-axis current */
    float    iq;          /* A — q-axis current */
    float    temp;        /* °C */
    float    enc_pos;     /* rad */
    float    enc_vel;     /* rad/s */
    uint32_t fault;
} MotorState_t;

/* ─── Global instances ──────────────────────────────────────────────────── */
static Params_t params = {
    .enable          = 0,
    .mode            = MODE_IDLE,
    .vel_setpoint    = 0.0f,
    .torque_setpoint = 0.0f,
    .vel_ramp_rate   = 1000.0f,
    .kp_vel          = 0.05f,
    .ki_vel          = 0.002f,
    .kp_curr_d       = 0.1f,
    .ki_curr_d       = 0.01f,
    .kp_curr_q       = 0.1f,
    .ki_curr_q       = 0.01f,
    .pole_pairs      = 7,
    .flux_linkage    = 0.0085f,
    .deadtime_ns     = 300,
    .encoder_cpr     = 4000,
    .max_rpm         = 4000.0f,
    .max_current     = 15.0f,
};

volatile MotorState_t motor = { 0 };

/* ═══════════════════════════════════════════════════════════════════════════
 * CDC receive line buffer
 * ═══════════════════════════════════════════════════════════════════════════ */
#define RX_BUF_SIZE  256
static uint8_t  rx_buf[RX_BUF_SIZE];
static uint16_t rx_head = 0;

/* Pending line ready flag — set in CDC callback, cleared in main loop */
static volatile uint8_t  line_ready = 0;
static char              line_buf[RX_BUF_SIZE];

/* ─── Telemetry flag from TIM6 ISR ─────────────────────────────────────── */
static volatile uint8_t  tele_ready = 0;

/* ─── Prototypes ──────────────────────────────────────────────────────── */
static void Protocol_HandleLine(char *line);
static void Protocol_HandleRead(const char *key);
static void Protocol_HandleWrite(const char *key, const char *val);
static void Protocol_SendTelemetry(void);
static void CDC_Send(const char *str);
static void CDC_Sendf(const char *fmt, ...);
static void Motor_ApplyParams(void);
static void Motor_UpdateSensors(void);

/* ═══════════════════════════════════════════════════════════════════════════
 * Peripheral handles (generated by CubeMX — declare extern or include main.h)
 * ═══════════════════════════════════════════════════════════════════════════ */
extern TIM_HandleTypeDef htim6;
/* extern ADC_HandleTypeDef hadc1; */
/* extern ADC_HandleTypeDef hadc2; */

/* ═══════════════════════════════════════════════════════════════════════════
 * main()
 * ═══════════════════════════════════════════════════════════════════════════ */
int main(void)
{
    /* CubeMX-generated init */
    HAL_Init();
    SystemClock_Config();      /* generated by CubeMX */
    MX_GPIO_Init();
    MX_DMA_Init();
    MX_ADC1_Init();
    /* MX_ADC2_Init(); */
    MX_TIM6_Init();
    MX_USB_Device_Init();      /* starts CDC enumeration */

    /* Start TIM6 in interrupt mode (100 ms → 10 Hz telemetry) */
    HAL_TIM_Base_Start_IT(&htim6);

    /* Main loop */
    while (1)
    {
        /* ── Process incoming serial line ─────────────────────────── */
        if (line_ready)
        {
            line_ready = 0;
            Protocol_HandleLine(line_buf);
        }

        /* ── Push telemetry (triggered by TIM6 ISR) ───────────────── */
        if (tele_ready)
        {
            tele_ready = 0;
            Motor_UpdateSensors();   /* read ADC / encoder */
            Protocol_SendTelemetry();
        }

        /* ── Motor control loop can go here or in a higher-freq timer ── */
        /* Motor_ControlLoop(); */
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CDC callbacks  (called from USB interrupt context — keep short)
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Called from usbd_cdc_if.c CDC_Receive_FS().
 * Accumulates bytes into rx_buf, sets line_ready when '\n' found.
 */
void Protocol_OnReceive(uint8_t *buf, uint32_t len)
{
    for (uint32_t i = 0; i < len; i++)
    {
        uint8_t c = buf[i];
        if (c == '\r') continue;   /* ignore CR */

        if (c == '\n')
        {
            rx_buf[rx_head] = '\0';
            if (rx_head > 0 && !line_ready)
            {
                memcpy(line_buf, rx_buf, rx_head + 1);
                line_ready = 1;
            }
            rx_head = 0;
        }
        else
        {
            if (rx_head < RX_BUF_SIZE - 1)
                rx_buf[rx_head++] = c;
        }
    }
}

/**
 * Called from usbd_cdc_if.c CDC_Control_FS() on SET_CONTROL_LINE_STATE.
 * DTR asserted (state=1) → send handshake.
 */
void Protocol_OnDTR(uint8_t state)
{
    if (state)
        CDC_Send(HANDSHAKE_STR);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Protocol parser
 * ═══════════════════════════════════════════════════════════════════════════ */

static void Protocol_HandleLine(char *line)
{
    /* ping → handshake */
    if (strcmp(line, "ping") == 0)
    {
        CDC_Send(HANDSHAKE_STR);
        return;
    }

    /* r <key> */
    if (line[0] == 'r' && line[1] == ' ')
    {
        Protocol_HandleRead(line + 2);
        return;
    }

    /* w <key> <value> */
    if (line[0] == 'w' && line[1] == ' ')
    {
        char *rest = line + 2;
        char *space = strchr(rest, ' ');
        if (!space) { CDC_Send("ERR:malformed write\n"); return; }
        *space = '\0';
        Protocol_HandleWrite(rest, space + 1);
        return;
    }

    CDC_Send("ERR:unknown command\n");
}

/* ─── Read handler ──────────────────────────────────────────────────────── */
static void Protocol_HandleRead(const char *key)
{
    char resp[80];

    /* Live telemetry keys */
    if      (!strcmp(key, "rpm"))      { CDC_Sendf("rpm=%.2f\n",      motor.rpm);     return; }
    else if (!strcmp(key, "vbus"))     { CDC_Sendf("vbus=%.3f\n",     motor.vbus);    return; }
    else if (!strcmp(key, "ibus"))     { CDC_Sendf("ibus=%.3f\n",     motor.ibus);    return; }
    else if (!strcmp(key, "ia"))       { CDC_Sendf("ia=%.4f\n",       motor.ia);      return; }
    else if (!strcmp(key, "ib"))       { CDC_Sendf("ib=%.4f\n",       motor.ib);      return; }
    else if (!strcmp(key, "id"))       { CDC_Sendf("id=%.4f\n",       motor.id);      return; }
    else if (!strcmp(key, "iq"))       { CDC_Sendf("iq=%.4f\n",       motor.iq);      return; }
    else if (!strcmp(key, "temp"))     { CDC_Sendf("temp=%.1f\n",     motor.temp);    return; }
    else if (!strcmp(key, "enc_pos"))  { CDC_Sendf("enc_pos=%.5f\n",  motor.enc_pos); return; }
    else if (!strcmp(key, "enc_vel"))  { CDC_Sendf("enc_vel=%.3f\n",  motor.enc_vel); return; }
    else if (!strcmp(key, "fault"))    { CDC_Sendf("fault=%lu\n",     motor.fault);   return; }

    /* Parameter keys */
    else if (!strcmp(key, "enable"))        CDC_Sendf("enable=%d\n",         params.enable);
    else if (!strcmp(key, "mode"))          CDC_Sendf("mode=%d\n",           (int)params.mode);
    else if (!strcmp(key, "vel_setpoint"))  CDC_Sendf("vel_setpoint=%.2f\n", params.vel_setpoint);
    else if (!strcmp(key, "torque_setpoint")) CDC_Sendf("torque_setpoint=%.3f\n", params.torque_setpoint);
    else if (!strcmp(key, "vel_ramp_rate")) CDC_Sendf("vel_ramp_rate=%.1f\n", params.vel_ramp_rate);
    else if (!strcmp(key, "kp_vel"))        CDC_Sendf("kp_vel=%.5f\n",       params.kp_vel);
    else if (!strcmp(key, "ki_vel"))        CDC_Sendf("ki_vel=%.5f\n",       params.ki_vel);
    else if (!strcmp(key, "kp_curr_d"))     CDC_Sendf("kp_curr_d=%.5f\n",    params.kp_curr_d);
    else if (!strcmp(key, "ki_curr_d"))     CDC_Sendf("ki_curr_d=%.5f\n",    params.ki_curr_d);
    else if (!strcmp(key, "kp_curr_q"))     CDC_Sendf("kp_curr_q=%.5f\n",    params.kp_curr_q);
    else if (!strcmp(key, "ki_curr_q"))     CDC_Sendf("ki_curr_q=%.5f\n",    params.ki_curr_q);
    else if (!strcmp(key, "pole_pairs"))    CDC_Sendf("pole_pairs=%d\n",      params.pole_pairs);
    else if (!strcmp(key, "flux_linkage"))  CDC_Sendf("flux_linkage=%.6f\n",  params.flux_linkage);
    else if (!strcmp(key, "deadtime_ns"))   CDC_Sendf("deadtime_ns=%d\n",     params.deadtime_ns);
    else if (!strcmp(key, "encoder_cpr"))   CDC_Sendf("encoder_cpr=%d\n",     params.encoder_cpr);
    else if (!strcmp(key, "max_rpm"))       CDC_Sendf("max_rpm=%.1f\n",       params.max_rpm);
    else if (!strcmp(key, "max_current"))   CDC_Sendf("max_current=%.2f\n",   params.max_current);
    else
    {
        snprintf(resp, sizeof(resp), "ERR:unknown key %s\n", key);
        CDC_Send(resp);
        return;
    }
}

/* ─── Write handler ─────────────────────────────────────────────────────── */
static void Protocol_HandleWrite(const char *key, const char *val)
{
    float fval  = strtof(val, NULL);
    int   ival  = (int)strtol(val, NULL, 10);
    uint8_t ok  = 1;

    if      (!strcmp(key, "enable"))
    {
        /* Safety: only allow enable if no active faults */
        if (ival && motor.fault)
        { CDC_Send("ERR:active fault — clear fault before enabling\n"); return; }
        params.enable = ival ? 1 : 0;
    }
    else if (!strcmp(key, "mode"))
    {
        if (ival < 0 || ival > 3) { CDC_Send("ERR:invalid mode (0-3)\n"); return; }
        params.mode = (ControlMode_t)ival;
    }
    else if (!strcmp(key, "vel_setpoint"))
    {
        if (fabsf(fval) > params.max_rpm) { CDC_Send("ERR:exceeds max_rpm\n"); return; }
        params.vel_setpoint = fval;
    }
    else if (!strcmp(key, "torque_setpoint"))
    {
        if (fabsf(fval) > params.max_current) { CDC_Send("ERR:exceeds max_current\n"); return; }
        params.torque_setpoint = fval;
    }
    else if (!strcmp(key, "vel_ramp_rate"))  params.vel_ramp_rate   = fval;
    else if (!strcmp(key, "kp_vel"))         params.kp_vel          = fval;
    else if (!strcmp(key, "ki_vel"))         params.ki_vel          = fval;
    else if (!strcmp(key, "kp_curr_d"))      params.kp_curr_d       = fval;
    else if (!strcmp(key, "ki_curr_d"))      params.ki_curr_d       = fval;
    else if (!strcmp(key, "kp_curr_q"))      params.kp_curr_q       = fval;
    else if (!strcmp(key, "ki_curr_q"))      params.ki_curr_q       = fval;
    else if (!strcmp(key, "pole_pairs"))     params.pole_pairs      = (uint8_t)ival;
    else if (!strcmp(key, "flux_linkage"))   params.flux_linkage    = fval;
    else if (!strcmp(key, "deadtime_ns"))    params.deadtime_ns     = (uint16_t)ival;
    else if (!strcmp(key, "encoder_cpr"))    params.encoder_cpr     = (uint16_t)ival;
    else if (!strcmp(key, "max_rpm"))        params.max_rpm         = fval;
    else if (!strcmp(key, "max_current"))    params.max_current     = fval;
    else if (!strcmp(key, "enc_pos"))
    {
        /* Write 0 to zero encoder position */
        motor.enc_pos = fval;
    }
    else if (!strcmp(key, "fault"))
    {
        if (ival == 0) motor.fault = 0;  /* clear faults */
    }
    else
    {
        char err[64];
        snprintf(err, sizeof(err), "ERR:unknown key %s\n", key);
        CDC_Send(err);
        return;
    }

    if (ok)
    {
        Motor_ApplyParams();   /* push new params to motor controller */
        CDC_Send("OK\n");
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Telemetry — called from main loop when tele_ready flag is set
 * Sends all live keys as "T key=value\n"
 * ═══════════════════════════════════════════════════════════════════════════ */
static void Protocol_SendTelemetry(void)
{
    /* High-rate keys (every 100 ms) */
    CDC_Sendf("T rpm=%.2f\n",     motor.rpm);
    CDC_Sendf("T vbus=%.3f\n",    motor.vbus);
    CDC_Sendf("T ibus=%.3f\n",    motor.ibus);
    CDC_Sendf("T ia=%.4f\n",      motor.ia);
    CDC_Sendf("T ib=%.4f\n",      motor.ib);
    CDC_Sendf("T id=%.4f\n",      motor.id);
    CDC_Sendf("T iq=%.4f\n",      motor.iq);
    CDC_Sendf("T enc_pos=%.5f\n", motor.enc_pos);
    CDC_Sendf("T enc_vel=%.3f\n", motor.enc_vel);
    CDC_Sendf("T fault=%lu\n",    motor.fault);

    /* Also broadcast current control state so GUI stays in sync */
    CDC_Sendf("T mode=%d\n",      (int)params.mode);
    CDC_Sendf("T enable=%d\n",    params.enable);

    /* Low-rate key: temperature — can throttle by adding a counter */
    CDC_Sendf("T temp=%.1f\n",    motor.temp);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Sensor update stub — replace with real ADC reads + encoder
 * ═══════════════════════════════════════════════════════════════════════════ */
static void Motor_UpdateSensors(void)
{
    /*
     * ── Replace these stubs with your actual ADC/encoder reads ──────────
     *
     * Example Vbus read (12-bit ADC, 3.3V ref, voltage divider 1/11):
     *   uint32_t raw = HAL_ADC_GetValue(&hadc1);
     *   motor.vbus = (raw / 4095.0f) * 3.3f * 11.0f;
     *
     * Example temperature (NTC linearised):
     *   motor.temp = NTC_RawToTemp(HAL_ADC_GetValue(&hadc1));
     *
     * Example encoder position:
     *   int32_t cnt = (int32_t)__HAL_TIM_GET_COUNTER(&htim3);
     *   motor.enc_pos = (float)cnt / params.encoder_cpr * 2.0f * (float)M_PI;
     *
     * Phase currents Ia, Ib come from your current sensing ADC.
     * RPM, Id, Iq come from your FOC algorithm.
     */

    /* STUB — sine wave demo so GUI shows live data without hardware */
    static float t = 0.0f;
    t += 0.1f;
    motor.rpm     = params.enable ? (params.vel_setpoint + 50.0f * sinf(t)) : 0.0f;
    motor.vbus    = 24.0f + 0.3f * sinf(t * 0.3f);
    motor.ibus    = params.enable ? (2.5f + 0.5f * sinf(t)) : 0.05f;
    motor.ia      = params.enable ? (3.5f * sinf(t)) : 0.0f;
    motor.ib      = params.enable ? (3.5f * sinf(t + 2.094f)) : 0.0f;
    motor.id      = params.enable ? (0.1f * sinf(t * 1.3f)) : 0.0f;
    motor.iq      = params.enable ? (params.torque_setpoint + 0.2f * sinf(t)) : 0.0f;
    motor.temp    = 35.0f + t * 0.01f;
    motor.enc_pos = motor.enc_pos + motor.enc_vel * 0.1f;
    motor.enc_vel = motor.rpm * 2.0f * (float)M_PI / 60.0f;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Apply parameters to motor controller
 * Replace with calls to your FOC / SVPWM driver
 * ═══════════════════════════════════════════════════════════════════════════ */
static void Motor_ApplyParams(void)
{
    /*
     * Example:
     *   FOC_SetVelocityPID(params.kp_vel, params.ki_vel);
     *   FOC_SetCurrentPID_D(params.kp_curr_d, params.ki_curr_d);
     *   FOC_SetCurrentPID_Q(params.kp_curr_q, params.ki_curr_q);
     *   FOC_SetPolePairs(params.pole_pairs);
     *   PWM_SetDeadTime(params.deadtime_ns);
     *   if (params.enable)
     *       FOC_Enable(params.mode, params.vel_setpoint, params.torque_setpoint);
     *   else
     *       FOC_Disable();
     */
    (void)0;  /* remove when implemented */
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CDC transmit helpers
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Send a static string. Retries once on BUSY. */
static void CDC_Send(const char *str)
{
    uint16_t len = (uint16_t)strlen(str);
    if (CDC_Transmit_FS((uint8_t *)str, len) == USBD_BUSY)
    {
        HAL_Delay(1);
        CDC_Transmit_FS((uint8_t *)str, len);
    }
}

/** printf-style CDC send */
static void CDC_Sendf(const char *fmt, ...)
{
    char buf[96];
    va_list args;
    va_start(args, fmt);
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    CDC_Send(buf);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * TIM6 interrupt → set telemetry flag (100 ms)
 * ═══════════════════════════════════════════════════════════════════════════ */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM6)
        tele_ready = 1;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Fault injection helper  (call from your protection IRQs)
 * ═══════════════════════════════════════════════════════════════════════════ */
void Motor_SetFault(uint32_t fault_bits)
{
    motor.fault  |= fault_bits;
    params.enable = 0;            /* auto-disable on fault */
    Motor_ApplyParams();
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Error handler (CubeMX-generated, keep as-is)
 * ═══════════════════════════════════════════════════════════════════════════ */
void Error_Handler(void)
{
    __disable_irq();
    while (1) {}
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line)
{
    (void)file; (void)line;
}
#endif

# OBhai BLDC Controller — Serial Protocol Reference

> For implementing this protocol on the STM32G431 side using USB CDC (Virtual COM Port).

---

## Transport

| Parameter | Value |
|-----------|-------|
| Interface | USB Full Speed, CDC ACM (Virtual COM Port) |
| Middleware | STM32CubeMX `USB_DEVICE` → Class: `CDC` |
| Encoding | ASCII text, UTF-8 |
| Framing | Newline-terminated (`\n`) |
| Baud | Irrelevant for CDC VCP; set 115200 in descriptor for compatibility |

---

## Handshake

When the GUI opens the serial port it:
1. Asserts **DTR** high
2. Sends `ping\n`

The STM32 must detect either the DTR edge **or** the `ping` command and respond immediately:

```
OBHAI_BLDC fw:1.0.0 hw:v2\n
```

Replace `fw:` and `hw:` with your actual firmware version and hardware revision.

The GUI checks that the line **starts with `OBHAI_BLDC`** and displays the rest as device info. If no handshake is received within **3 seconds**, the GUI shows a warning.

**STM32 implementation tip:**
```c
// In CDC_Receive_FS callback:
if (strncmp((char*)Buf, "ping", 4) == 0) {
    char resp[] = "OBHAI_BLDC fw:1.0.0 hw:v2\n";
    CDC_Transmit_FS((uint8_t*)resp, strlen(resp));
}
```

---

## Command Format (GUI → MCU)

All commands are ASCII, newline-terminated:

```
w <key> <value>\n     → write a parameter
r <key>\n             → read a parameter
ping\n                → request handshake string
```

---

## Response Format (MCU → GUI)

```
<key>=<value>\n       → response to r <key>
OK\n                  → acknowledgement of w <key> <value>
ERR:<message>\n       → error (malformed command, unknown key, out-of-range value, etc.)
OBHAI_BLDC ...\n      → identity / handshake string
T <key>=<value>\n     → telemetry push (autonomous, MCU-initiated)
```

---

## Telemetry (MCU Push)

The MCU should push telemetry autonomously at a fixed rate (recommended: **10 Hz** for most keys, **1–5 Hz** for slow keys like temp).

Format:
```
T rpm=1234.5\n
T vbus=24.01\n
T id=0.123\n
```

Recommended telemetry loop in STM32 (e.g., TIM interrupt at 100ms):
```c
void telemetry_send(void) {
    char buf[64];
    snprintf(buf, sizeof(buf), "T rpm=%.2f\n", motor.rpm);
    CDC_Transmit_FS((uint8_t*)buf, strlen(buf));
    // ... repeat for other keys
}
```

---

## Parameter Key Reference

### Read / Write Parameters

| Key | Type | Unit | Description |
|-----|------|------|-------------|
| `enable` | int | 0/1 | Motor enable (1=on, 0=off) |
| `mode` | int | — | 0=Idle, 1=Velocity, 2=Torque, 3=Open-loop |
| `vel_setpoint` | float | RPM | Velocity setpoint |
| `torque_setpoint` | float | A | Torque (Iq) setpoint |
| `vel_ramp_rate` | float | RPM/s | Velocity ramp rate |
| `kp_vel` | float | — | Velocity loop proportional gain |
| `ki_vel` | float | — | Velocity loop integral gain |
| `kp_curr_d` | float | — | D-axis current loop Kp |
| `ki_curr_d` | float | — | D-axis current loop Ki |
| `kp_curr_q` | float | — | Q-axis current loop Kp |
| `ki_curr_q` | float | — | Q-axis current loop Ki |
| `pole_pairs` | int | — | Motor pole pairs |
| `flux_linkage` | float | Wb | Permanent magnet flux linkage λ |
| `deadtime_ns` | int | ns | PWM dead time |
| `encoder_cpr` | int | — | Encoder counts per revolution |
| `max_rpm` | float | RPM | Maximum allowed RPM |
| `max_current` | float | A | Maximum phase current |
| `enc_pos` | float | rad | Encoder position (writable to zero) |
| `fault` | int | — | Fault bitmask (write 0 to clear) |

### Read-Only / Telemetry Keys

| Key | Type | Unit | Description |
|-----|------|------|-------------|
| `rpm` | float | RPM | Measured motor speed |
| `vbus` | float | V | DC bus voltage |
| `ibus` | float | A | DC bus current |
| `ia` | float | A | Phase A current |
| `ib` | float | A | Phase B current |
| `id` | float | A | D-axis current |
| `iq` | float | A | Q-axis current |
| `temp` | float | °C | Board temperature |
| `enc_vel` | float | rad/s | Encoder angular velocity |
| `mode` | int | — | Current mode (telemetry echo) |
| `enable` | int | 0/1 | Current enable state (telemetry echo) |

---

## Fault Bitmask (example — define to match your firmware)

| Bit | Meaning |
|-----|---------|
| 0 | Overcurrent |
| 1 | Overvoltage |
| 2 | Undervoltage |
| 3 | Overtemperature |
| 4 | Encoder error |
| 5 | Hall sensor error |
| 6 | DRV fault |
| 7 | Watchdog timeout |

---

## Example Session

```
GUI opens port → asserts DTR → sends "ping\n"
STM32 → "OBHAI_BLDC fw:1.0.0 hw:v2\n"

GUI → "r vbus\n"
STM32 → "vbus=24.01\n"

GUI → "w mode 1\n"
STM32 → "OK\n"

GUI → "w vel_setpoint 1000\n"
STM32 → "OK\n"

STM32 → "T rpm=987.5\n"    (autonomous push)
STM32 → "T vbus=23.98\n"
STM32 → "T id=0.021\n"
STM32 → "T iq=3.410\n"

GUI → "w enable 0\n"
STM32 → "OK\n"
```

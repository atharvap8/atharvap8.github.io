## Introduction

A gas leak in a kitchen or utility room is a silent, invisible threat. Unlike fire or electricity, LPG (Liquefied Petroleum Gas) gives no visual warning — it pools near the floor, spreads quickly, and can ignite from a spark as small as a light switch flick. The statistics are sobering: thousands of gas explosion incidents occur annually in Indian households, mostly because there was no early warning and no automatic response.

This project builds a full-stack **IoT-based Gas Safety System** using an **ESP32**, an **MQ-2 gas sensor**, a **servo motor**, an **exhaust fan relay**, and Wi-Fi-based real-time alerting. When a gas leak is detected, the system doesn't just sound a buzzer — it takes a cascade of automated, physical actions: it closes the LPG regulator with a servo, switches on an exhaust fan to ventilate the room, and simultaneously pushes a notification to your phone. All of this happens within seconds, without any human intervention.

The system also addresses the two most common failure modes of amateur gas detectors: **false alarms** (sensor noise triggering the system unnecessarily) and **no enclosure protection** (the electronics themselves becoming a spark hazard near leaking gas). Both are handled deliberately in this design.

---

## The Threat Model

Before designing the system, it's worth understanding exactly what we're protecting against:

| Hazard | Risk Level | Our Mitigation |
|---|---|---|
| LPG accumulation to explosive concentration | Critical | Exhaust fan ventilation on detection |
| Ignition from stove burner or switch | Critical | Servo closes regulator immediately |
| User unaware of leak (asleep, away) | High | Wi-Fi push notification to phone |
| Sensor false alarm causing panic | Medium | Hysteresis + time-averaging filter |
| Electronics sparking near gas | Medium | Sealed fireproof enclosure |
| System failure during power cut | Medium | Documented as limitation; battery backup in future scope |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   GAS SAFETY SYSTEM OVERVIEW                    │
│                                                                 │
│   ┌───────────────┐     ADC Reading     ┌──────────────────┐   │
│   │  MQ-2 Gas     │ ─────────────────►  │                  │   │
│   │  Sensor       │                     │   ESP32 BRAIN    │   │
│   └───────────────┘                     │                  │   │
│                                         │  ┌────────────┐  │   │
│   ┌───────────────┐   Digital Input     │  │  Filter &  │  │   │
│   │  Reset Button │ ─────────────────►  │  │  Threshold │  │   │
│   └───────────────┘                     │  │  Logic     │  │   │
│                                         │  └────────────┘  │   │
│                                         └──────────────────┘   │
│                                               │    │    │       │
│          ┌────────────────────────────────────┘    │    └────────────────┐
│          ▼                                         ▼                     ▼
│  ┌───────────────┐                    ┌───────────────────┐   ┌──────────────────┐
│  │  Servo Motor  │                    │  Relay Module     │   │  Wi-Fi → Phone   │
│  │  (Gas Valve)  │                    │  (Exhaust Fan)    │   │  Notification    │
│  └───────────────┘                    └───────────────────┘   └──────────────────┘
│                                               │                                   │
│                                       ┌───────────────┐                           │
│                                       │  Buzzer       │                           │
│                                       └───────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Components Required

| Component | Specification | Purpose |
|---|---|---|
| ESP32 WROOM-32 | Dual-core, Wi-Fi | Main controller + cloud alerting |
| MQ-2 Gas Sensor Module | Analog + digital output | LPG/Propane/Methane/Smoke detection |
| Servo Motor | SG90 or MG996R | Physically turn gas regulator handle |
| Relay Module (5V) | Single channel, optocoupler isolated | Switch exhaust fan |
| Exhaust Fan | 230V AC, 15–30W | Room ventilation |
| Buzzer | Active type, 5V, 85–100dB | Local audible alert |
| 5V Power Supply | 1.5A minimum | Powers ESP32, servo, sensor |
| Fireproof Enclosure | Metal (preferably) or ABS with vents | Physically seals electronics |
| Push Button | Normal open | Manual reset after alarm |
| Status LEDs (x3) | Red / Green / Yellow | System state at a glance |
| 10kΩ Resistors | 1/4W | Pull-downs / signal biasing |
| Breadboard or Custom PCB | — | Circuit assembly |
| Jumper / Heat-Shrink Wires | Appropriate AWG | Connections |

---

## The MQ-2 Sensor — Understanding What You're Working With

The **MQ-2** is a semiconductor gas sensor that uses a tin dioxide (SnO₂) sensing element. Its resistance drops when combustible gases are present in the environment. This resistance change is converted to an analog voltage output and a configurable digital threshold output.

### Gases It Can Detect
- **LPG** (primary for kitchen safety)
- Methane (CH4)
- Propane
- Hydrogen
- Smoke (particulate)
- Carbon Monoxide (partially)

### Understanding the Output

```
Clean Air: Sensor Resistance HIGH → Output Voltage LOW (~0.4V)
Gas Present: Sensor Resistance DROPS → Output Voltage RISES (up to 3.3V+)
```

The **ADC reading on ESP32** (0–4095 for 12-bit on 0–3.3V input) is used as the primary measurement:

| ADC Reading | Approximate Gas Level | System Response |
|---|---|---|
| 0 – 800 | Clean air | No action |
| 800 – 1200 | Trace levels / sensor drift | Warning LED, monitoring |
| 1200 – 2000 | Moderate gas presence | Yellow alert, start fan pre-emptively |
| 2000+ | High concentration | Full alarm sequence triggered |

> **Important**: The MQ-2 requires a **2–3 minute warm-up period** after power-on before readings stabilize. The firmware accounts for this with a boot-time warm-up delay.

---

## False Alarm Prevention — Hysteresis + Time Averaging

The most common complaint about DIY gas detectors is false alarms — the system triggering from cooking fumes, aerosol sprays, or sensor noise. This is solved with a two-stage approach:

### Stage 1: Rolling Average Filter

Instead of acting on a single ADC reading, the firmware maintains a **16-sample rolling average**:

```cpp
#define SAMPLES 16
int sampleBuffer[SAMPLES] = {0};
int sampleIndex = 0;

int getFilteredReading() {
  sampleBuffer[sampleIndex] = analogRead(GAS_SENSOR_PIN);
  sampleIndex = (sampleIndex + 1) % SAMPLES;
  
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) sum += sampleBuffer[i];
  return sum / SAMPLES;
}
```

### Stage 2: Sustained Threshold (Hysteresis)

A single spike above the alarm threshold is not enough to trigger. The reading must **stay above threshold for 3 consecutive seconds** before the alarm fires:

```cpp
int consecutiveHighReadings = 0;
#define ALARM_THRESHOLD 2000
#define CONSECUTIVE_REQUIRED 30  // 30 × 100ms loop = 3 seconds

void checkGasLevel() {
  int level = getFilteredReading();
  
  if (level >= ALARM_THRESHOLD) {
    consecutiveHighReadings++;
    if (consecutiveHighReadings >= CONSECUTIVE_REQUIRED) {
      triggerAlarm();
    }
  } else {
    consecutiveHighReadings = 0;  // Reset on any clean reading
  }
}
```

This combination dramatically reduces false triggers from brief aerosol exposure, while still reacting promptly to a genuine, sustained gas leak.

---

## Servo Motor — Closing the Gas Regulator

The servo motor is the most mechanically critical element of this project. It physically rotates the **On/Off lever on the LPG cylinder regulator** to the closed position.

### Mounting Setup

```
         Gas Cylinder
              │
         [Regulator]
        ╔════════╗
        ║  OFF ◄─║─── Servo arm attached here via 3D printed bracket
        ║        ║       or custom wire linkage
        ║   ON   ║
        ╚════════╝
```

The servo arm is positioned at the "ON" position at system startup. When an alarm triggers, the servo sweeps to the "OFF" position.

### Key Considerations
- **Torque**: A standard **SG90 micro servo (1.8 kg·cm)** is typically sufficient for most regulator levers. For stiffer regulators, use an **MG996R (9.4 kg·cm)**
- **Startup position**: The servo must home to the "ON" position on power-up so it doesn't accidentally close the regulator on every boot
- **Mechanical play**: The linkage must have zero backlash — if the arm slips, the regulator may not fully close

```cpp
#include <ESP32Servo.h>

Servo gasValveServo;
#define SERVO_PIN 15
#define SERVO_OPEN_ANGLE  0    // Regulator ON position
#define SERVO_CLOSED_ANGLE 90  // Regulator OFF position

void setup() {
  gasValveServo.attach(SERVO_PIN);
  gasValveServo.write(SERVO_OPEN_ANGLE); // Home to open on boot
  delay(500);
}

void closeGasRegulator() {
  for (int angle = SERVO_OPEN_ANGLE; angle <= SERVO_CLOSED_ANGLE; angle++) {
    gasValveServo.write(angle);
    delay(15); // Slow sweep for reliable mechanical movement
  }
}
```

---

## Wi-Fi Alerting — Push Notifications to Phone

The ESP32 connects to the home Wi-Fi network and uses one of two alerting methods:

### Method 1: Email via SMTP (Gmail App Password)

```cpp
#include <ESP_Mail_Client.h>

SMTPSession smtp;
Session_Config smtpConfig;

void sendEmailAlert(String gasLevel) {
  smtpConfig.server.host_name = "smtp.gmail.com";
  smtpConfig.server.port = 465;
  smtpConfig.login.email = "your_email@gmail.com";
  smtpConfig.login.password = "your_app_password"; // Use App Password, not main password
  smtpConfig.login.user_domain = "";

  SMTP_Message message;
  message.sender.name = "Gas Safety System";
  message.sender.email = "your_email@gmail.com";
  message.subject = "⚠️ GAS LEAK DETECTED!";
  message.addRecipient("Owner", "owner_email@gmail.com");
  message.text.content = "Gas leak detected! Level: " + gasLevel + 
                          "\nAutomatic shutoff has been activated.";

  smtp.connect(&smtpConfig);
  MailClient.sendMail(&smtp, &message);
}
```

### Method 2: Push Notification via Pushover / Pushbullet API

For instant phone popup notifications (no app needed beyond the Pushover client):

```cpp
#include <HTTPClient.h>

void sendPushNotification(int gasLevel) {
  HTTPClient http;
  http.begin("https://api.pushover.net/1/messages.json");
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String payload = "token=YOUR_APP_TOKEN"
                   "&user=YOUR_USER_KEY"
                   "&title=GAS LEAK ALERT"
                   "&message=Gas level: " + String(gasLevel) + 
                   " — Regulator closed. Ventilating."
                   "&priority=1"; // High priority — notification bypasses DND
  
  http.POST(payload);
  http.end();
}
```

---

## Full Alarm Sequence

When gas concentration exceeds threshold for 3 sustained seconds:

```
T+0s   → Alarm confirmed. Begin response sequence.
T+0s   → Buzzer activates (continuous tone)
T+0.5s → Exhaust fan relay energizes (fan ON)
T+1s   → Servo sweeps to CLOSED position (gas regulator OFF)
T+2s   → Wi-Fi connection verified
T+3s   → Email + push notification sent to owner's phone
T+3s   → Red LED solid ON
T+∞    → System holds in alarm state until manual reset button pressed
         (System does NOT auto-reset — safety by design)
```

The **manual reset requirement** is intentional. The system will not reset itself automatically. A human must physically press the reset button after:
1. Verifying the gas leak is resolved
2. Ventilating the room completely
3. Checking the appliance that caused the leak

Only then is the system armed again.

---

## Fireproof Enclosure Design

⚠️ This is a non-negotiable safety feature. The entire control electronics are housed inside a **sealed metal enclosure** with:

- **No exposed spark-producing components** accessible from outside
- **Ventilation slots covered with mesh** (allows airflow for thermal management without allowing gas ingress from a floor-level pool)
- **Gland fittings** on all cable entry/exit points to prevent gas from entering the enclosure
- **Mounting position**: At least **100cm above floor level** — LPG is heavier than air and pools low. Electronics mounted high avoid the densest gas concentrations.

The sensor probe itself (MQ-2) is routed outside the enclosure on a short cable to the detection zone (near the stove / cylinder area), while the active electronics remain protected inside.

---

## Physical Installation Guide

### Step 1: Locate the Gas Cylinder and Stove
Choose an enclosure mounting point:
- Within Wi-Fi range
- Within servo linkage distance of the cylinder regulator
- At least 1 meter above floor level
- Away from direct heat sources (stove burner, oven)

### Step 2: Mount the Servo on the Regulator
Fabricate a mounting bracket (3D printed or bent aluminum sheet) that:
- Holds the servo body rigidly above/beside the regulator
- Links the servo arm to the regulator lever with a rigid rod or stiff wire
- Allows full range of motion from ON to OFF positions without binding

Test servo operation with the cylinder OFF (closed at source valve) before connecting to an active cylinder.

### Step 3: Wire and Test on Bench First
Always complete the full electronics assembly and firmware test on the workbench before installation. Simulate gas detection by increasing the threshold temporarily and verify:
- Buzzer sounds ✓
- Relay clicks / fan turns on ✓
- Servo sweeps to closed position ✓
- Notification sent to phone ✓
- Manual reset button logs the system back to normal ✓

### Step 4: Install and Commission
1. Mount enclosure to the wall
2. Run MQ-2 sensor probe wire to detection zone
3. Position servo on regulator — test that servo can close the regulator fully
4. Apply power
5. Wait 3 minutes for MQ-2 warm-up
6. Verify green status LED (system armed, reading clean air)

---

## Advantages
- **Multi-layer response**: Mechanical, ventilation, and remote alerting — not just a buzzer
- **False alarm resistance**: Sustained threshold + rolling average prevents spurious triggers
- **Non-sparking enclosure**: Electronics sealed away from gas accumulation zones
- **Immediate mechanical action**: Servo closes regulator even if Wi-Fi is unavailable
- **Low cost**: Complete system buildable under ₹800 with basic components

## Disadvantages
- **Power-dependent**: System does not function during power outages (gas leaks can occur any time)
- **Servo mechanical reliability**: Needs periodic inspection to ensure servo linkage hasn't loosened
- **MQ-2 cross-sensitivity**: Sensor responds to smoke, aerosols, and alcohol vapour — high-traffic kitchens may need sensitivity adjustment
- **Wi-Fi required for alerting**: No alert reaches owner if the Wi-Fi router is down

---

## Future Improvements

- **Battery backup**: UPS circuit (18650 Li-ion + TP4056 charger) to maintain operation during power cuts
- **GSM module (SIM800L)**: SMS alerts when Wi-Fi is not available — works on mobile network
- **LCD status display**: Small OLED showing current gas level, system status, and last alarm time
- **MQTT broker integration**: Connect to Home Assistant or Node-RED for centralized smart home safety dashboards
- **Multiple gas sensors**: Add MQ-7 (CO) and MQ-135 (air quality) for a complete kitchen safety station
- **E-paper display**: Ultra-low-power status display that shows current gas level even in deep sleep mode
- **OTA firmware updates**: Remote firmware updates without physically accessing the enclosure

---

## Conclusion

The IoT Gas Safety System is one of those rare embedded projects where the output isn't a blinking LED or a sensor reading on a serial monitor — it's genuine safety for a household. The combination of automated mechanical response (servo closes the valve), ventilation (exhaust fan), and remote notification (phone alert) means that a gas leak is addressed immediately and comprehensively, even if no one is home.

The deliberate design choices around false alarm prevention, sealed enclosure, high mounting position, and mandatory manual reset after an alarm all contribute to a system that is reliable enough for daily deployment in a real kitchen. Building it teaches a rare combination of skills: sensor signal processing, servo mechanical integration, IoT cloud messaging, and safety engineering thinking.

*When gas safety is concerned, a system that sometimes fails to alert is worse than no system at all. This one is designed to be trustworthy.*

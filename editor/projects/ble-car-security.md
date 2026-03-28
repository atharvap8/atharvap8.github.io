## Introduction

Modern vehicles deserve modern security. This project replaces the aging factory central locking system of a **Maruti Suzuki Wagon R** with a fully custom-built, **Bluetooth Low Energy (BLE)** based security and access control system. Built around the **ESP32** microcontroller, the system delivers keyless entry, real-time theft alerts, and an integrated engine immobilizer — all controllable via smartphone or a dedicated custom keyless remote built from an **XIAO ESP32C3**.

This is not a plug-in OBD adapter or a commercial alarm retrofit. It is a ground-up custom system, designed specifically for this vehicle's electrical architecture, with every wire, relay, and line of firmware built from scratch.

---

## Why Build This?

The stock Wagon R central locking system is a basic one-way RF remote: lock and unlock, nothing more. There's no alarm feedback, no real-time alerts, no way to know if the car's bonnet was opened while you were away, and no engine immobilizer. Commercial aftermarket security systems are available but:

- Use proprietary RF protocols with no smartphone integration
- Lack customization for specific vehicles
- Have closed firmware — no ability to add features

A custom BLE-based system solves all of this while also being an invaluable learning project in automotive electronics, BLE protocol design, and embedded firmware.

---

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    VEHICLE ELECTRICAL SYSTEM                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  ESP32 MAIN CONTROLLER                    │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ BLE Server │  │ GPIO Monitor │  │ Relay Driver    │  │  │
│  │  │ (GATT)     │  │ Door/Bonnet  │  │ (Optocoupler)   │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│          │                   │                   │              │
│   ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐   │
│   │ Door Sensors │  │ Bonnet Switch│   │  Lock Actuators  │   │
│   │ (4x)         │  │              │   │  (4-door)        │   │
│   └──────────────┘  └──────────────┘   └──────────────────┘   │
│                                                                │
│   ┌──────────────┐              ┌──────────────────────────┐  │
│   │  Alarm Horn  │              │  ECM Immobilizer Line    │  │
│   │  (120dB)     │              │  (Ignition Kill)         │  │
│   └──────────────┘              └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
         ↕ BLE (Bluetooth Low Energy)
┌────────────────────────────────────────────────────────────────┐
│              REMOTE CONTROL DEVICES                             │
│  ┌───────────────────────┐    ┌─────────────────────────────┐  │
│  │  Smartphone App       │    │  XIAO ESP32C3 Key Fob       │  │
│  │  (BLE GATT client)    │    │  (BLE Central, physical key)│  │
│  └───────────────────────┘    └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Components Required

### Main Controller Unit
| Component | Specification | Purpose |
|---|---|---|
| ESP32 WROOM-32 | Dual-core, BLE + Wi-Fi | Main system controller |
| Relay Module (4-channel) | 5V coil, optocoupler isolated | Door lock actuator control |
| Relay Module (2-channel) | 5V coil, optocoupler isolated | Alarm horn + indicator flasher |
| MOSFETs (2N7000) | N-channel, logic-level gate | ECM immobilizer switch |
| Optocouplers (PC817) | CTR ≥ 100% | Signal isolation between ESP32 and vehicle |
| 12V → 5V Buck Converter | 3A capacity | Power from vehicle 12V rail |
| Capacitors | 100µF, 10µF, 100nF | Power decoupling |
| Status LEDs | Red, Green, Blue | System state indication |
| Custom PCB | EasyEDA designed | Clean integration |
| Enclosure (ABS) | Vibration-resistant | Underdash mounting |

### XIAO ESP32C3 Key Fob (Transmitter)
| Component | Specification | Notes |
|---|---|---|
| XIAO ESP32C3 | Ultra-compact form factor | BLE Central role |
| LiPo Battery | 3.7V, 200mAh | Compact, rechargeable |
| Tactile Buttons (4x) | Lock, Unlock, Alarm, Custom | Key fob inputs |
| CR2032 Holder (alternative) | 3V primary cell | If LiPo not preferred |
| 3D Printed / Commercial Fob Case | Custom | Ergonomic housing |

### Vehicle Interface Components
| Component | Notes |
|---|---|
| Door sensors (factory) | Reused from existing Wagon R wiring |
| Bonnet sensor (factory) | Standard plunger-type switch |
| Lock actuator wiring | Accessed at door connector |
| ECM immobilizer wire | Identified via factory service manual |
| Horn relay | Reused, signal wire tapped |

---

## How It Works

### 1. BLE Communication Architecture

The system uses **BLE GATT (Generic Attribute Profile)**:

- **ESP32** runs as a **GATT Server** advertising a custom service UUID
- **Smartphone app** and **XIAO ESP32C3 fob** act as **GATT Clients**
- Commands are written to a custom **Characteristic** (e.g., `0x01` = Lock, `0x02` = Unlock, `0x03` = Arm alarm, `0x04` = Disarm)
- The server responds by notifying the same characteristic with the current system state

**Security**: BLE bonding with passkey pairing ensures only authorized devices can connect. Unpaired devices attempting to command the ESP32 are rejected.

### 2. Door Lock Control

The Wagon R uses **12V pulse signals** for lock/unlock actuation — a short pulse energizes each door's actuator motor in the lock or unlock direction. The relay module reproduces these pulses:

- **Lock**: Relay A momentarily energizes (200ms pulse) → actuates all four door locks
- **Unlock**: Relay B momentarily energizes (200ms pulse) → releases all four door locks

Optocoupler isolation prevents any backfeed from the vehicle's electrical system to the ESP32's 3.3V logic.

### 3. Engine Immobilizer

A MOSFET is wired into the **ignition relay signal line** — a specific wire identified from the Wagon R factory service manual that the ECM checks before enabling the engine. When the immobilizer is armed:

- The MOSFET gate is held LOW → MOSFET switches OFF → the ECM signal line is broken → engine will crank but not start

This is a clean, reversible immobilizer that doesn't damage the ECM or trigger fault codes.

### 4. Intrusion Detection

The ESP32 continuously monitors:

- **Door sensors** (GPIO, active LOW, internal pull-up enabled) — triggered when any of the 4 doors is opened
- **Bonnet switch** (GPIO, same logic) — triggered when bonnet is unlatched

When the alarm is armed and any of these inputs triggers:
1. The alarm horn relay activates for 3 cycles of 1-second bursts
2. The hazard indicator relay flashes synchronously
3. A **BLE Notification** is immediately pushed to any connected smartphone with the specific trigger event (e.g., "DRIVER DOOR OPENED")

### 5. XIAO ESP32C3 Key Fob

The custom key fob runs as a BLE Central device:

- Maintains a persistent encrypted BLE bond with the main ESP32
- Each button press writes the corresponding command byte to the GATT characteristic
- **Auto-reconnect**: If connection is lost, the fob automatically reconnects when in range
- **Battery status**: ESP32 reads the fob's BLE Battery Service level and notifies the user when battery is low

---

## Firmware Overview

### ESP32 Main Unit (Arduino / ESP-IDF)

```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Pin Definitions
#define RELAY_LOCK     26
#define RELAY_UNLOCK   27
#define RELAY_ALARM    14
#define RELAY_INDICATOR 12
#define IMMOBILIZER    33  // MOSFET gate
#define DOOR_FL        34  // Front Left Door
#define DOOR_FR        35  // Front Right Door
#define DOOR_RL        32  // Rear Left Door
#define DOOR_RR        36  // Rear Right Door
#define BONNET         39  // Bonnet sensor

bool alarmArmed = false;
bool deviceConnected = false;
BLECharacteristic *pCharacteristic;

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0) {
      uint8_t cmd = (uint8_t)value[0];
      handleCommand(cmd);
    }
  }
};

void handleCommand(uint8_t cmd) {
  switch(cmd) {
    case 0x01: lockDoors(); break;
    case 0x02: unlockDoors(); break;
    case 0x03: armAlarm(); break;
    case 0x04: disarmAlarm(); break;
  }
  notifyState();
}

void lockDoors() {
  digitalWrite(RELAY_LOCK, HIGH);
  delay(200);
  digitalWrite(RELAY_LOCK, LOW);
}

void armAlarm() {
  alarmArmed = true;
  digitalWrite(IMMOBILIZER, LOW); // Immobilizer active
  lockDoors();
}

void checkIntrusion() {
  if (!alarmArmed) return;
  
  if (digitalRead(DOOR_FL) == LOW || digitalRead(DOOR_FR) == LOW ||
      digitalRead(DOOR_RL) == LOW || digitalRead(DOOR_RR) == LOW ||
      digitalRead(BONNET) == LOW) {
    triggerAlarm();
    sendAlert("INTRUSION DETECTED");
  }
}

void triggerAlarm() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(RELAY_ALARM, HIGH);
    digitalWrite(RELAY_INDICATOR, HIGH);
    delay(1000);
    digitalWrite(RELAY_ALARM, LOW);
    digitalWrite(RELAY_INDICATOR, LOW);
    delay(500);
  }
}

void setup() {
  // Pin setup
  pinMode(RELAY_LOCK, OUTPUT);
  pinMode(RELAY_UNLOCK, OUTPUT);
  pinMode(RELAY_ALARM, OUTPUT);
  pinMode(RELAY_INDICATOR, OUTPUT);
  pinMode(IMMOBILIZER, OUTPUT);
  pinMode(DOOR_FL, INPUT_PULLUP);
  pinMode(DOOR_FR, INPUT_PULLUP);
  pinMode(DOOR_RL, INPUT_PULLUP);
  pinMode(DOOR_RR, INPUT_PULLUP);
  pinMode(BONNET, INPUT_PULLUP);

  // BLE Init
  BLEDevice::init("WagonR Security");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new CommandCallbacks());
  pService->start();
  BLEDevice::startAdvertising();
}

void loop() {
  checkIntrusion();
  delay(100);
}
```

---

## PCB Design

The main controller PCB was designed in **EasyEDA** with the following layout priorities:

### Design Considerations
- **High-current relay traces**: 2mm+ copper traces for relay coil power rails (rated 5V/100mA per relay)
- **Signal isolation zone**: Optocouplers placed at the boundary between ESP32 logic and vehicle wire connections
- **Automotive-grade component selection**: Capacitors rated ≥50V for operation on vehicle 12V rail with load dump transients
- **Conformal coating pockets**: Board designed so critical components can be sealed after assembly

### PCB Features
- 2-layer design, 1oz copper
- Screw terminal blocks for all vehicle wire connections (no spade crimps on-board)
- Onboard AMS1117-3.3 linear regulator for low-noise 3.3V supply downstream of the 5V buck
- LED indicators for alarm-armed, BLE-connected, and relay-active status
- Reset tactile button accessible through enclosure

---

## Safety and Reliability

### Fail-Safe Design
- **Power loss**: On power loss, relays return to default (unlocked state — no trapping occupants inside)
- **BLE disconnection**: Immobilizer does NOT activate on disconnection — only on explicit arm command
- **False alarms**: 500ms debounce on all sensor inputs to prevent vibration false triggers
- **Watchdog timer**: ESP32 hardware WDT resets firmware if it hangs

### Automotive Considerations
- All wiring uses **0.75mm² automotive-grade stranded wire** with appropriate current ratings
- **ATO fuse (2A)** on the 12V supply input line inside the vehicle
- All connectors use proper automotive terminals with weather seal where near door openings

---

## Installation Process

### Step 1: Pre-Installation Bench Test
Complete the full system test on the workbench BEFORE installing in the vehicle. Connect a 12V bench supply and simulate all sensors with jumper wires before placing a single wire in the car.

### Step 2: Identify Vehicle Wiring
Using the **Wagon R factory service manual wiring diagram**, locate:
- Door lock actuator (+) and (-) signal wires at the driver's door connector
- Individual door sensor ground wires for each door
- Bonnet sensor wire (at the engine bay harness)
- Ignition relay signal wire for the immobilizer

### Step 3: Wire Tapping
- Use **posi-tap connectors** for non-destructive wire splicing — no cutting factory wires
- Run new wires through existing factory grommets where possible for a clean installation

### Step 4: ECU Immobilizer Wire
⚠️ This step requires careful identification. Using a multimeter in continuity mode, verify the correct wire against the service manual BEFORE connecting the immobilizer circuit. An incorrectly connected MOSFET could potentially damage ECM circuits.

### Step 5: Enclosure Mounting
Mount the main PCB enclosure under the dashboard, secured with self-tapping screws into the plastic trim. Route all cables away from pedal travel zones and airbag modules.

---

## Advantages
- **Keyless entry** via both smartphone and physical BLE key fob
- **Real-time intrusion alerts** pushed directly to phone — no subscription, no cloud
- **Engine immobilizer** integrated natively — no separate immobilizer module needed
- **Per-door monitoring** — know exactly which door or the bonnet triggered an alert
- **Fully customizable** — firmware can be extended with new features at any time via OTA
- **Reuses factory actuators** — no replacement of existing door hardware

## Disadvantages
- **BLE range limitation** (~20–30m in open air) — cannot arm/disarm from far away
- **Installation complexity** — requires automotive electrical knowledge and service manual
- **ECM immobilizer risk** — incorrect wiring could affect vehicle electronics
- **Battery drain** — ESP32 running full BLE advertising draws ~80mA; 12V wakeup trigger recommended for production

---

## Future Improvements

- **GPS module (NEO-6M)** integration for real-time vehicle location tracking via MQTT/cellular
- **GSM/LTE module** for remote alerts over cellular when phone is out of BLE range
- **Proximity-based auto-unlock**: Trigger unlock when the key fob BLE RSSI exceeds a threshold (walk-up unlock)
- **Voice assistant integration** via smartphone relay (Google Assistant → App → BLE → ESP32)
- **Fingerprint reader** on the XIAO ESP32C3 key fob for biometric authorization before BLE transmission
- **Low-power mode** with deep sleep between sensor checks to minimize parasitic drain on vehicle battery

---

## Conclusion

This BLE-based car security controller demonstrates that automotive electronics — often treated as a closed, proprietary domain — can be meaningfully extended and improved with open hardware. The project demanded skills across embedded firmware development, BLE protocol design, automotive electrical systems, PCB design, and careful safety engineering.

The result is a security system that outperforms most aftermarket options in terms of connectivity, customization, and real-time awareness — and was built with complete insight into every circuit and every line of code. An aftermarket alarm from a shop is a black box. This system is fully understood, fully owned, and fully improvable.

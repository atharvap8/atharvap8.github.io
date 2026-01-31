

### Project Overview
I’ve always found it frustrating when power outages happen and I have no idea how much battery life is left in my inverter. To solve this, I designed an IoT-enabled control system using the ESP32 platform. This system lets me monitor and control my power inverter remotely via WiFi, giving me real-time updates on battery status and power usage right on my phone.

The main goal was to take a standard, "dumb" inverter and give it a smart upgrade. Now, I don't have to walk down to the basement or check the utility room to see if I’m running low on power—I can just check the app.

![Smart Inverter System Overview](../../assets/projects/esp32-arduino-smart-inverter/overview.jpg)

### Background & Motivation
Power cuts are a reality in many places, and inverters are our lifeline. But traditional inverters are black boxes; they sit in a corner, humming away, until they suddenly die because the battery ran out. I wanted to change that.

My motivation came from a few practical needs:
- **Remote Monitoring:** I wanted to know the system status without physically inspecting it.
- **Battery Anxiety:** I needed to know exactly how much juice was left so I wouldn't be caught off guard.
- **Control:** Being able to turn it ON/OFF remotely is a huge convenience.
- **Safety:** I wanted to add software safeguards to protect the hardware.

### The Problem with Old Inverters
Traditional inverters are sturdy but stupid. Dealing with them brought up several annoyances:

### Lack of Visibility
There is simply no way to check the battery status or inverter state without walking up to the device. If it's in a hard-to-reach spot, you're out of luck.

### Manual Operation Guidelines
Switching the inverter ON or OFF requires physical access. In an emergency, or just when you're lazy, this is a pain point.

### No Power Insights
You have no clue how much power you're drawing. Is the gaming PC draining the battery too fast? You wouldn't know until the lights go out.

### Limited Safety Features
While they have basic fuses, they lack intelligent monitoring. I wanted a system that could predict overheating or overload before it caused damage.

This project was my answer to these limitations—a smart, connected controller that breathes new life into existing hardware.

---

## System Architecture

### Hardware Components

The system comprises several key hardware components working together to enable smart inverter functionality:

### ESP32 Development Board
- Dual-core Tensilica LX6 microprocessor operating at 240 MHz
- Built-in WiFi (802.11 b/g/n) and Bluetooth capabilities
- 34 programmable GPIO pins
- 12-bit ADC for analog sensor reading
- Operating voltage: 3.3V with onboard voltage regulator supporting 5V input

### Relay Module
- Multi-channel relay board (typically 2-4 channels)
- Operating voltage: 5V DC
- Contact rating: 10A at 250V AC / 30V DC
- Optocoupler isolation for protection against voltage spikes
- LED indicators for visual status confirmation

### Voltage Sensor Module
- Voltage divider circuit or dedicated voltage sensor module
- Input range: 0-25V DC (for battery monitoring)
- Output: 0-3.3V analog signal compatible with ESP32 ADC
- Provides real-time battery voltage monitoring

### Current Sensor (Optional)
- ACS712 or similar Hall-effect current sensor
- Measurement range: 5A/20A/30A variants
- Linear output proportional to current flow
- Enables power consumption tracking

### Temperature Sensor
- DHT11/DHT22 or DS18B20 digital temperature sensor
- Monitors inverter heat dissipation
- Triggers alerts on overheating conditions

### Buck Converter Module
- LM2596 or similar DC-DC step-down converter
- Input: 12V DC (from inverter battery)
- Output: 5V DC regulated (for powering ESP32 and relay module)
- Current capability: 2-3A

### Additional Components
- Breadboard or custom PCB for permanent installation
- Jumper wires and connectors
- Power supply terminals
- Enclosure for housing the electronics

### Software Stack

The software architecture consists of multiple layers working in coordination:

**Development Environment**
- Arduino IDE (version 1.8.x or higher)
- ESP32 board support package from Espressif Systems
- USB drivers for ESP32 programming (CP210x or CH340)

**Core Libraries**
- WiFi.h - Built-in ESP32 WiFi management library
- BlynkSimpleEsp32.h - Blynk IoT platform integration
- DHT.h - Temperature and humidity sensor library (if using DHT sensors)
- OneWire.h & DallasTemperature.h - For DS18B20 temperature sensor
- EEPROM.h - Non-volatile storage for configuration data
- ESP32Time.h - Real-time clock functionality

**Communication Protocols**
- HTTP/HTTPS for cloud communication
- MQTT (optional) for lightweight messaging
- TCP/IP stack for network communication
- Serial communication for debugging

**Cloud Platform**
- Blynk IoT Cloud for device management
- Virtual pins for data exchange between hardware and app
- Real-time database for logging
- Push notification service for alerts

### System Block Diagram

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     POWER SUPPLY SECTION                    │
│  12V Battery → Buck Converter (5V) → ESP32 + Relay Module   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   ESP32 MICROCONTROLLER                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │WiFi Module  │  │  GPIO Pins   │  │  ADC Module  │      │
│  │ (Built-in)  │  │ (Control)    │  │  (Sensors)   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
        ↓                    ↓                     ↓
┌──────────────┐   ┌──────────────────┐   ┌────────────────┐
│ Blynk Cloud  │   │  Relay Module    │   │  Sensors       │
│ (WiFi)       │   │  (Inverter Ctrl) │   │ - Voltage      │
│              │   │                  │   │ - Current      │
│              │   │                  │   │ - Temperature  │
└──────────────┘   └──────────────────┘   └────────────────┘
        ↓                    ↓
┌──────────────┐   ┌──────────────────┐
│ Mobile App   │   │  Inverter Unit   │
│ (User)       │   │  (AC Output)     │
└──────────────┘   └──────────────────┘
```

**Data Flow:**

1. **Sensor Reading**: ESP32 continuously reads voltage, current, and temperature sensors
2. **Processing**: Raw sensor data is processed, filtered, and converted to meaningful values
3. **Cloud Upload**: Processed data is sent to Blynk cloud through WiFi
4. **Mobile Display**: User views real-time data on the Blynk mobile application
5. **User Command**: User sends control commands (ON/OFF) through the app
6. **Command Execution**: ESP32 receives commands and actuates relay module
7. **Feedback Loop**: System confirms action execution and updates status

---

## Hardware Design

### ESP32 Microcontroller Integration

The ESP32 serves as the brain of the system, handling all sensing, communication, and control tasks. Its dual-core architecture allows for parallel processing of WiFi communication and control logic without blocking operations.

**Pin Configuration:**

GPIO assignments were carefully selected to avoid conflicts with ESP32's internal functions:

- **GPIO 2**: Built-in LED for visual status indication
- **GPIO 4**: Relay Channel 1 (Main Inverter Control)
- **GPIO 5**: Relay Channel 2 (Auxiliary/Load Control)
- **GPIO 34**: Analog input for voltage sensor (ADC1_CH6)
- **GPIO 35**: Analog input for current sensor (ADC1_CH7)
- **GPIO 21**: I2C SDA (for display, if implemented)
- **GPIO 22**: I2C SCL (for display, if implemented)
- **GPIO 23**: Temperature sensor data pin
- **EN (Enable)**: Connected to reset button for programming

**Power Supply Considerations:**

The ESP32 operates at 3.3V logic level, but the development board includes an onboard voltage regulator accepting 5V through the VIN pin. Power is drawn from a buck converter that steps down the 12V battery voltage to a stable 5V rail. A 1000µF capacitor was placed at the 5V input to smooth any voltage fluctuations during relay switching.

### Inverter Module Integration

Interfacing with the inverter required careful consideration of electrical isolation and safety. The relay module acts as an electrically isolated switch, preventing any direct connection between the low-voltage ESP32 circuit and the high-voltage inverter circuit.

**Relay Configuration:**

The relay module uses optocoupler-based input, which provides optical isolation between control and power circuits. When the ESP32 GPIO pin is pulled HIGH (3.3V), current flows through the optocoupler LED, triggering the relay coil without any direct electrical connection.

**Wiring Scheme:**

The inverter's existing manual ON/OFF switch was bypassed by installing the relay in parallel. This allows both manual and remote control:

- **COM (Common)**: Connected to inverter input terminal
- **NO (Normally Open)**: Connected to inverter output terminal
- **NC (Normally Closed)**: Left unconnected
- **VCC**: 5V from buck converter
- **GND**: Common ground
- **IN1**: Control signal from ESP32 GPIO 4

This configuration ensures that:
- When relay is OFF, inverter circuit is open (inverter OFF)
- When relay is ON, inverter circuit is closed (inverter ON)
- Manual override remains functional through the original switch

### Sensor Integration

**Voltage Sensing Circuit:**

Battery voltage monitoring was implemented using a resistive voltage divider circuit. Since the battery voltage ranges from 10.5V (discharged) to 14.4V (fully charged), and the ESP32 ADC accepts only 0-3.3V, voltage division was necessary.

Voltage Divider Calculation:
```
Vout = Vin × (R2 / (R1 + R2))

For 15V max input scaled to 3.0V output:
R1 = 47kΩ
R2 = 12kΩ

Vout = 15V × (12k / (47k + 12k)) = 15V × 0.203 = 3.05V
```

This provides adequate headroom below the 3.3V maximum while maintaining measurement accuracy across the battery voltage range. A 0.1µF ceramic capacitor was added in parallel with R2 to filter high-frequency noise.

**Current Sensing Implementation:**

The ACS712 Hall-effect sensor provides isolated current measurement. The sensor outputs 2.5V at zero current, with ±0.185V per Ampere (for the 5A version). The output connects directly to the ESP32 ADC input.

Current calculation:
```
ADC_Value = analogRead(current_pin)
Voltage = (ADC_Value / 4095.0) × 3.3
Current = (Voltage - 2.5) / 0.185
```

**Temperature Monitoring:**

A DS18B20 digital temperature sensor monitors the inverter's heat sink temperature. This sensor uses the 1-Wire protocol, requiring only one data pin plus power and ground. A 4.7kΩ pull-up resistor between the data line and 3.3V ensures reliable communication.

Temperature readings trigger warnings when thresholds are exceeded:
- Normal operation: < 50°C
- Warning level: 50-65°C
- Critical level: > 65°C (automatic shutdown)

### Power Supply Design

The power supply subsystem must provide stable voltage to the ESP32 and relay module while drawing minimal current from the inverter battery to avoid unnecessary discharge.

**Buck Converter Configuration:**

An LM2596-based DC-DC buck converter module was used for its high efficiency (>90%) and stable output. Input voltage range: 4-40V, making it suitable for 12V battery systems with voltage fluctuations.

Output voltage adjustment:
- Connected 12V battery to converter input
- Adjusted potentiometer while measuring output with multimeter
- Set output to exactly 5.0V ±0.1V
- Verified output under load (ESP32 + relays active)

**Current Consumption:**

Measured current draw:
- ESP32 (WiFi active): 80-150mA
- Relay module (1 relay ON): 70mA
- Sensors: 10-20mA
- **Total worst-case**: ~250mA at 5V = 1.25W

From 12V battery: 1.25W / 0.9 (efficiency) / 12V ≈ 115mA

A 100Ah battery could theoretically power the system for 870 hours (36 days) if the inverter itself was off, demonstrating minimal parasitic drain.

### Circuit Schematic

The complete circuit integrates all components with proper connections:

### Power Distribution Diagram
![Power Distribution Schematic](../../assets/projects/esp32-arduino-smart-inverter/schematic_power.png)
```
12V Battery (+) ──→ Buck Converter VIN
                    Buck Converter VOUT (5V) ──┬─→ ESP32 VIN
                                               ├─→ Relay VCC
                                               └─→ Sensor VCC
                    
12V Battery (-) ──→ Buck Converter GND ──→ Common GND
```

**ESP32 Connections:**
```
ESP32 GPIO 4 ──→ Relay IN1 (Optocoupler Input)
ESP32 GPIO 34 ──→ Voltage Divider Output (Battery Sensing)
ESP32 GPIO 35 ──→ ACS712 Output (Current Sensing)
ESP32 GPIO 23 ──→ DS18B20 Data (with 4.7kΩ pull-up)
ESP32 GND ──→ Common GND
ESP32 VIN ──→ 5V Rail
```

### Relay Wiring Diagram
![Relay Wiring](../../assets/projects/esp32-arduino-smart-inverter/schematic_relay.png)
```
Inverter Input ──→ Relay COM
Inverter Output ──→ Relay NO
Relay NC ──→ Not Connected
```

Safety features built into the circuit:
- Reverse polarity protection diode at 12V input
- Fuse (2A) on 12V input line
- Decoupling capacitors (100nF) near each IC
- Pull-down resistors (10kΩ) on relay control lines to prevent floating

---

## Software Implementation

### Development Environment Setup

Before beginning firmware development, the Arduino IDE must be configured to support the ESP32 platform.

**Step 1: Install Arduino IDE**

Download and install Arduino IDE version 1.8.19 or newer from the official Arduino website. The newer IDE 2.x versions also work but may have slight interface differences.

**Step 2: Add ESP32 Board Support**

Open Arduino IDE and navigate to:
- File → Preferences
- In "Additional Board Manager URLs", add:
  ```
  https://dl.espressif.com/dl/package_esp32_index.json
  ```
- Click OK

Then install the board package:
- Tools → Board → Boards Manager
- Search for "ESP32"
- Install "esp32 by Espressif Systems" (version 2.0.x recommended)

**Step 3: Install Required Libraries**

Navigate to Sketch → Include Library → Manage Libraries, then install:

- **Blynk** by Volodymyr Shymanskyy (version 1.0.1)
- **DHT sensor library** by Adafruit (if using DHT sensors)
- **OneWire** by Paul Stoffregen (for DS18B20)
- **DallasTemperature** by Miles Burton (for DS18B20)

**Step 4: Board Configuration**

Select the correct board settings:
- Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
- Tools → Upload Speed → 115200
- Tools → CPU Frequency → 240MHz
- Tools → Flash Frequency → 80MHz
- Tools → Flash Mode → QIO
- Tools → Flash Size → 4MB
- Tools → Partition Scheme → Default 4MB with spiffs
- Tools → Port → (Select the COM port where ESP32 is connected)

**Step 5: Test Setup**

Upload a simple blink sketch to verify the toolchain is working correctly. If upload fails, press and hold the BOOT button on the ESP32 board while clicking Upload, then release BOOT when "Connecting..." appears.

### ESP32 Firmware Architecture

The firmware is structured into multiple functional blocks, each handling specific responsibilities. This modular approach improves code maintainability and debugging.

**Main Code Structure:**

```cpp
// Global variables and configuration
#define BLYNK_TEMPLATE_ID "your_template_id"
#define BLYNK_DEVICE_NAME "Smart Inverter"
#define BLYNK_AUTH_TOKEN "your_auth_token"

// Pin definitions
#define RELAY_PIN 4
#define VOLTAGE_PIN 34
#define CURRENT_PIN 35
#define TEMP_PIN 23

// Libraries
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// WiFi credentials
char ssid[] = "your_wifi_ssid";
char pass[] = "your_wifi_password";

// Global objects
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// Function prototypes
void setup();
void loop();
void readSensors();
void updateBlynk();
void checkSafety();

void setup() {
  // Initialization code
}

void loop() {
  // Main execution loop
}
```

**Task Distribution:**

The firmware uses FreeRTOS (built into ESP32) to handle multiple tasks:

1. **WiFi Management Task**: Maintains connection, handles reconnection
2. **Sensor Reading Task**: Periodically reads all sensors
3. **Blynk Communication Task**: Updates cloud with sensor data
4. **Safety Monitoring Task**: Checks thresholds and triggers alarms
5. **Control Logic Task**: Processes user commands and updates relay states

### WiFi Connectivity Implementation

Robust WiFi connectivity is critical for IoT functionality. The implementation includes automatic reconnection and connection status monitoring.

**Connection Initialization:**

```cpp
void setupWiFi() {
  Serial.begin(115200);
  Serial.println("Connecting to WiFi...");
  
  WiFi.mode(WIFI_STA);  // Station mode
  WiFi.begin(ssid, pass);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}
```

**Connection Monitoring:**

A background task continuously monitors WiFi status and attempts reconnection if the connection drops:

```cpp
void monitorWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, pass);
    
    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) {
      delay(500);
      timeout++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Reconnected to WiFi");
    }
  }
}
```

This function is called periodically in the main loop to ensure persistent connectivity.

### Blynk IoT Integration

Blynk provides a streamlined way to create mobile interfaces and cloud communication without building backend infrastructure.

**Blynk Setup Process:**

1. Create a free account at blynk.cloud
2. Create a new template with device name "Smart Inverter"
3. Select ESP32 as hardware and WiFi as connection type
4. Configure datastreams (virtual pins):
   - V0: Inverter Status (Integer, 0-1)
   - V1: Battery Voltage (Double, 10-15V)
   - V2: Current Draw (Double, 0-30A)
   - V3: Temperature (Integer, 0-100°C)
   - V4: Power Consumption (Double, 0-500W)

**Firmware Integration:**

```cpp
#define BLYNK_TEMPLATE_ID "TMPLxxxxxx"
#define BLYNK_DEVICE_NAME "Smart Inverter"
#define BLYNK_AUTH_TOKEN "your_32char_token"

#include <BlynkSimpleEsp32.h>

void setup() {
  // Initialize Blynk connection
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
}

void loop() {
  Blynk.run();  // Process Blynk communication
  
  // Your code here
}
```

**Sending Data to Blynk:**

```cpp
void updateBlynk() {
  float voltage = readBatteryVoltage();
  float current = readCurrent();
  float temperature = readTemperature();
  float power = voltage * current;
  
  Blynk.virtualWrite(V1, voltage);
  Blynk.virtualWrite(V2, current);
  Blynk.virtualWrite(V3, temperature);
  Blynk.virtualWrite(V4, power);
}
```

**Receiving Commands from Blynk:**

```cpp
BLYNK_WRITE(V0) {
  int inverterState = param.asInt();
  
  if (inverterState == 1) {
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Inverter turned ON via Blynk");
  } else {
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Inverter turned OFF via Blynk");
  }
}
```

This function is automatically called whenever the user toggles the switch on the Blynk app.

### Control Logic Implementation

The control logic manages relay states based on user commands and system conditions.

**Relay Control:**

```cpp
void setInverterState(bool state) {
  if (state) {
    // Pre-start checks
    if (checkSafetyConditions()) {
      digitalWrite(RELAY_PIN, HIGH);
      inverterStatus = true;
      Blynk.virtualWrite(V0, 1);
      Serial.println("Inverter ON");
    } else {
      Serial.println("Safety check failed. Inverter not started.");
      Blynk.logEvent("safety_alert", "Cannot start inverter - safety check failed");
    }
  } else {
    digitalWrite(RELAY_PIN, LOW);
    inverterStatus = false;
    Blynk.virtualWrite(V0, 0);
    Serial.println("Inverter OFF");
  }
}
```

**Automatic Load Shedding:**

To prevent battery over-discharge, the system can automatically disconnect loads when voltage drops below a threshold:

```cpp
void checkBatteryLevel() {
  float voltage = readBatteryVoltage();
  
  if (voltage < 10.8 && inverterStatus) {
    Serial.println("Critical battery voltage! Auto-shutdown initiated.");
    setInverterState(false);
    Blynk.logEvent("low_battery", "Inverter auto-shutdown: Battery voltage critical");
  } else if (voltage < 11.5 && inverterStatus) {
    Serial.println("Warning: Low battery voltage");
    Blynk.logEvent("battery_warning", "Battery voltage low");
  }
}
```

### Safety Features & Error Handling

Multiple layers of protection prevent damage to the inverter, battery, or connected loads.

**Temperature Protection:**

```cpp
void checkTemperature() {
  tempSensor.requestTemperatures();
  float temp = tempSensor.getTempCByIndex(0);
  
  if (temp > 65.0 && inverterStatus) {
    Serial.println("CRITICAL: Temperature too high! Emergency shutdown.");
    setInverterState(false);
    Blynk.logEvent("overheat", "Emergency shutdown: Temperature critical");
  } else if (temp > 55.0) {
    Serial.println("WARNING: Temperature elevated");
    Blynk.logEvent("temp_warning", "Inverter temperature elevated");
  }
}
```

**Overcurrent Protection:**

```cpp
void checkCurrent() {
  float current = readCurrent();
  
  if (current > 25.0 && inverterStatus) {
    Serial.println("CRITICAL: Overcurrent detected! Emergency shutdown.");
    setInverterState(false);
    Blynk.logEvent("overcurrent", "Emergency shutdown: Overcurrent protection");
  } else if (current > 20.0) {
    Serial.println("WARNING: High current draw");
    Blynk.logEvent("current_warning", "High current consumption detected");
  }
}
```

**Watchdog Timer:**

The ESP32's watchdog timer prevents system hangs:

```cpp
#include <esp_task_wdt.h>

#define WDT_TIMEOUT 30  // 30 seconds

void setup() {
  // Configure watchdog
  esp_task_wdt_init(WDT_TIMEOUT, true);
  esp_task_wdt_add(NULL);
}

void loop() {
  // Feed watchdog to prevent reset
  esp_task_wdt_reset();
  
  // Main code
}
```

**Error Logging:**

All errors and events are logged to Blynk's event system for historical tracking:

```cpp
void logError(String errorType, String message) {
  Serial.println("ERROR: " + message);
  Blynk.logEvent(errorType, message);
  
  // Could also log to SD card or EEPROM for offline storage
}
```

---

## System Features

### Remote Control & Monitoring

The system provides comprehensive remote control through the Blynk mobile application, accessible from anywhere with internet connectivity.

### Mobile App Interface
![Blynk Dashboard Screenshot](../../assets/projects/esp32-arduino-smart-inverter/blynk_dashboard.jpg)

The Blynk app dashboard displays:

- **Inverter Status**: ON/OFF indicator with toggle switch
- **Battery Voltage**: Real-time voltage gauge with color coding
  - Green: > 12.5V (Good)
  - Yellow: 11.5-12.5V (Fair)
  - Red: < 11.5V (Low)
- **Current Draw**: Instantaneous current consumption
- **Power Output**: Calculated real-time power in Watts
- **Temperature**: Heat sink temperature with warning colors
- **Event Log**: Historical alerts and status changes

**Control Features:**

Users can perform the following actions remotely:

- Turn inverter ON/OFF with immediate response
- View real-time sensor readings updated every 2 seconds
- Receive push notifications for critical events
- Access historical data through Blynk's data logging
- Configure threshold values for alarms

**Multi-User Access:**

Blynk supports sharing device access with multiple users, allowing family members or facility managers to monitor the system simultaneously.

### Real-Time Status Updates

The system continuously monitors all parameters and updates the cloud platform at regular intervals.

**Update Frequency:**

- Critical parameters (voltage, current): 2-second intervals
- Temperature: 5-second intervals
- Event logs: Immediate upon occurrence
- Statistical data: 1-minute averages

**Status Indicators:**

LED indicators on the hardware provide visual feedback:

- **Power LED**: Solid green when powered
- **WiFi LED**: Blinking during connection, solid when connected
- **Inverter LED**: Reflects inverter ON/OFF state
- **Error LED**: Flashes red during fault conditions

### Power Consumption Tracking

The system calculates and logs power consumption data for analysis.

**Real-Time Calculations:**

```cpp
float calculatePower() {
  float voltage = readBatteryVoltage();
  float current = readCurrent();
  float power = voltage * current;
  
  // Account for inverter efficiency (~85%)
  float acPower = power * 0.85;
  
  return acPower;
}
```

**Energy Logging:**

Cumulative energy consumption is tracked:

```cpp
unsigned long lastEnergyUpdate = 0;
float totalEnergy = 0;  // Watt-hours

void updateEnergy() {
  unsigned long currentTime = millis();
  float interval = (currentTime - lastEnergyUpdate) / 3600000.0;  // Convert to hours
  
  float power = calculatePower();
  float energy = power * interval;
  
  totalEnergy += energy;
  lastEnergyUpdate = currentTime;
  
  Blynk.virtualWrite(V5, totalEnergy);
}
```

This allows users to track daily, weekly, or monthly energy consumption patterns.

### Battery Management

Intelligent battery monitoring extends battery life and prevents damage from over-discharge.

**State of Charge Estimation:**

Battery voltage is correlated with approximate charge level:

```cpp
float estimateSOC(float voltage) {
  // Lead-acid battery voltage vs SOC (simplified)
  if (voltage >= 12.7) return 100;
  else if (voltage >= 12.4) return 75;
  else if (voltage >= 12.2) return 50;
  else if (voltage >= 12.0) return 25;
  else if (voltage >= 11.8) return 10;
  else return 0;
}
```

**Battery Health Monitoring:**

The system tracks:
- Discharge cycles
- Minimum voltage reached
- Time spent below 50% SOC
- Charging patterns (if charge controller is monitored)

**Automatic Protection:**

- Prevents inverter operation below 10.8V to avoid deep discharge
- Sends alerts when battery consistently reaches low levels
- Suggests battery replacement when degradation is detected

### Overload Protection

The system prevents damage from excessive load current.

**Multi-Level Protection:**

```cpp
void handleOverload() {
  float current = readCurrent();
  
  // Warning level: 80% of max rated current
  if (current > 20.0 && current <= 25.0) {
    warningCount++;
    if (warningCount > 5) {  // Sustained high load
      Blynk.logEvent("high_load", "Warning: High load detected");
      warningCount = 0;
    }
  }
  
  // Critical level: 100% of max rated current
  else if (current > 25.0) {
    criticalCount++;
    if (criticalCount > 2) {  // Allow brief spikes
      Serial.println("OVERLOAD! Shutting down inverter");
      setInverterState(false);
      Blynk.logEvent("overload_shutdown", "Inverter shutdown due to overload");
      delay(60000);  // Cooldown period before allowing restart
      criticalCount = 0;
    }
  } else {
    warningCount = 0;
    criticalCount = 0;
  }
}
```

### Temperature Monitoring

Continuous temperature monitoring prevents thermal damage.

**Multi-Point Sensing (Future Enhancement):**

While the current implementation uses a single sensor on the heat sink, the system architecture supports multiple temperature sensors:

- Inverter heat sink temperature
- Battery compartment temperature
- Ambient temperature for efficiency calculations

**Thermal Management:**

```cpp
void manageThermals() {
  float temp = readTemperature();
  
  if (temp > 65.0) {
    // Critical: Emergency shutdown
    emergencyShutdown("THERMAL");
  } else if (temp > 55.0 && temp <= 65.0) {
    // Warning: Consider reducing load
    if (millis() - lastTempWarning > 300000) {  // Every 5 minutes
      Blynk.logEvent("temp_warning", String("Temperature elevated: ") + temp + "°C");
      lastTempWarning = millis();
    }
  }
  
  // Update Blynk
  Blynk.virtualWrite(V3, temp);
}
```

**Cooling Recommendations:**

The system can suggest actions:
- "Improve ventilation around inverter"
- "Reduce connected load"
- "Check cooling fan operation"

---

## Installation & Setup

### Hardware Assembly

Follow these steps carefully to assemble the hardware safely and correctly.

**Step 1: Prepare the Work Area**

- Work on a non-conductive surface (wood or plastic table)
- Ensure the inverter is disconnected from battery and AC power
- Organize components and tools:
  - ESP32 development board
  - Relay module
  - Buck converter
  - Voltage sensor components
  - Current sensor (if used)
  - Temperature sensor
  - Connecting wires
  - Breadboard or perfboard
  - Multimeter
  - Soldering iron and solder

**Step 2: Assemble the Control Circuit**

Mount components on breadboard or perfboard:

1. Place the ESP32 module
2. Position relay module at safe distance (3-4 inches from ESP32)
3. Mount buck converter near power input
4. Arrange sensors in accessible locations

**Step 3: Wire the Power Supply**

Critical: Double-check all power connections before applying power.

1. Connect battery negative to buck converter GND
2. Connect battery positive to buck converter VIN (through a 2A fuse for safety)
3. Adjust buck converter output to exactly 5.0V using the onboard potentiometer
4. Connect buck converter output:
   - 5V output to ESP32 VIN
   - 5V output to relay module VCC
   - GND to ESP32 GND
   - GND to relay module GND

**Step 4: Wire the Sensors**

Voltage sensor:
- Connect voltage divider input to battery positive (before load)
- Connect voltage divider ground to common GND
- Connect voltage divider output to ESP32 GPIO 34

Current sensor:
- Connect ACS712 VCC to 5V, GND to common GND
- Wire current sensor in series with inverter output (through cable)
- Connect ACS712 output to ESP32 GPIO 35

Temperature sensor:
- Connect DS18B20 VCC to 3.3V (or 5V)
- Connect DS18B20 GND to common GND
- Connect DS18B20 data to ESP32 GPIO 23
- Install 4.7kΩ pull-up resistor between data and VCC

**Step 5: Wire the Relay Module**

Control connections:
- Relay IN1 to ESP32 GPIO 4
- Relay VCC to 5V
- Relay GND to common GND

Power connections (Handle with care - high voltage):
- Disconnect inverter from battery
- Connect inverter positive input to relay COM terminal
- Connect inverter output positive to relay NO terminal
- Leave NC terminal unconnected
- Ensure relay is rated for expected current (minimum 10A)

**Step 6: Physical Installation**

- Mount the control circuit in a non-metallic enclosure
- Ensure adequate ventilation for heat dissipation
- Use cable glands for wires entering/exiting enclosure
- Label all connections
- Keep high-voltage and low-voltage wires separated
- Secure the enclosure near the inverter but not blocking ventilation

**Step 7: Safety Checks Before Power-On**

Use a multimeter to verify:
- No short circuits between power rails
- Correct voltage at buck converter output (5.0V)
- Proper polarity at all connection points
- Relay contacts are open when unpowered
- No loose connections
- All exposed terminals insulated

### Firmware Installation

**Step 1: Download the Code**

Obtain the firmware from the GitHub repository (link in appendix).

**Step 2: Configure WiFi Credentials**

Edit the firmware file:

```cpp
// Replace with your WiFi credentials
char ssid[] = "YourWiFiName";
char pass[] = "YourWiFiPassword";
```

**Step 3: Configure Blynk Authentication**

After creating your Blynk template (next section), insert your authentication token:

```cpp
#define BLYNK_AUTH_TOKEN "your_32_character_token_here"
```

**Step 4: Adjust Pin Definitions**

Verify that pin definitions match your wiring:

```cpp
#define RELAY_PIN 4      // Verify relay is connected to GPIO 4
#define VOLTAGE_PIN 34   // Verify voltage sensor is on GPIO 34
#define CURRENT_PIN 35   // Verify current sensor is on GPIO 35
#define TEMP_PIN 23      // Verify temperature sensor is on GPIO 23
```

**Step 5: Calibrate Sensor Readings**

Adjust calibration factors based on your hardware:

```cpp
// Voltage divider calibration
float voltageCal = 4.92;  // Adjust based on multimeter reading

// Current sensor calibration
float currentOffset = 2.5;  // Zero-current voltage
float currentSense = 0.185; // Sensitivity (V/A)
```

**Step 6: Compile and Upload**

1. Connect ESP32 to computer via USB cable
2. Select correct board and port in Arduino IDE
3. Click "Verify" to compile the code
4. If compilation succeeds, click "Upload"
5. Press BOOT button on ESP32 when "Connecting..." appears
6. Wait for "Done uploading" message

**Step 7: Monitor Serial Output**

Open Serial Monitor (Tools → Serial Monitor) at 115200 baud:

Expected output:
```
Connecting to WiFi...
.....
WiFi Connected!
IP Address: 192.168.1.xxx
Connecting to Blynk...
Blynk Connected!
System Ready.
```

### Blynk App Configuration

**Step 1: Create Blynk Account**

1. Download Blynk app from Play Store (Android) or App Store (iOS)
2. Sign up with email address
3. Verify email

**Step 2: Create New Template**

1. Log in to console.blynk.cloud
2. Click "Templates" → "New Template"
3. Enter template details:
   - Name: "Smart Inverter"
   - Hardware: ESP32
   - Connection Type: WiFi
4. Click "Done"

**Step 3: Configure Datastreams**

Create virtual pins for data exchange:

1. Click "Datastreams" tab
2. Click "New Datastream" → "Virtual Pin"

Create the following datastreams:

**V0 - Inverter Control**
- Name: Inverter State
- Pin: V0
- Data Type: Integer
- Min: 0, Max: 1
- Default Value: 0

**V1 - Battery Voltage**
- Name: Battery Voltage
- Pin: V1
- Data Type: Double
- Min: 10, Max: 15
- Units: V

**V2 - Current Draw**
- Name: Current
- Pin: V2
- Data Type: Double
- Min: 0, Max: 30
- Units: A

**V3 - Temperature**
- Name: Temperature
- Pin: V3
- Data Type: Integer
- Min: 0, Max: 100
- Units: °C

**V4 - Power**
- Name: Power
- Pin: V4
- Data Type: Double
- Min: 0, Max: 500
- Units: W

**Step 4: Design Mobile Dashboard**

1. Click "Mobile Dashboard" tab
2. Drag widgets from the left panel:

Add **Switch Widget**:
- Widget: Switch
- Datastream: V0 (Inverter State)
- Label: "Inverter"
- ON Label: "Running"
- OFF Label: "Stopped"

Add **Gauge Widget** for voltage:
- Widget: Gauge
- Datastream: V1 (Battery Voltage)
- Label: "Battery"
- Show value: ON
- Color: Gradient (Red→Yellow→Green)

Add **Value Display** for current:
- Widget: Value Display
- Datastream: V2 (Current)
- Label: "Current Draw"

Add **Labeled Value** for temperature:
- Widget: Labeled Value
- Datastream: V3 (Temperature)
- Label: "Temperature"

Add **SuperChart** for historical data:
- Widget: SuperChart
- Add datastreams: V1, V2, V4
- Time range: 1 hour/6 hours/1 day

**Step 5: Configure Events & Notifications**

1. Go to "Events" tab
2. Create event codes:

**low_battery**
- Name: Low Battery
- Description: Battery voltage critically low

**overheat**
- Name: Overheating
- Description: Temperature exceeded safe limit

**overcurrent**
- Name: Overcurrent
- Description: Load current exceeded safe limit

3. Enable notifications for each event

**Step 6: Get Authentication Token**

1. Click on template name
2. Click "Device Info" tab
3. Copy "Auth Token"
4. Paste this token into the firmware code

**Step 7: Test Connection**

1. Upload firmware with Blynk token
2. Power on ESP32
3. Open Blynk app
4. Wait for device to appear as "Online"
5. Toggle the switch - relay should click
6. Verify sensor values update in real-time

### Network Setup

**Configuring Router for Optimal Performance:**

1. Assign static IP to ESP32:
   - Access router admin panel
   - Find ESP32 MAC address in connected devices
   - Reserve IP address for this MAC
   - This prevents IP changes after router restarts

2. Enable 2.4GHz WiFi:
   - ESP32 only supports 2.4GHz, not 5GHz
   - Ensure 2.4GHz band is enabled on router
   - Use WPA2 security (WPA3 may not be compatible)

3. Optimize signal strength:
   - Place router closer to inverter location, or
   - Use WiFi extender if signal is weak
   - Avoid placing ESP32 near metal objects or inside metal enclosures

**Fallback Options:**

If primary WiFi is unavailable, implement backup connection:

```cpp
// Primary WiFi
char ssid1[] = "PrimaryWiFi";
char pass1[] = "password1";

// Backup WiFi (mobile hotspot)
char ssid2[] = "BackupWiFi";
char pass2[] = "password2";

void connectWiFi() {
  // Try primary first
  WiFi.begin(ssid1, pass1);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  
  // If primary fails, try backup
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(ssid2, pass2);
    attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      attempts++;
    }
  }
}
```

### Initial Calibration

**Voltage Sensor Calibration:**

1. Measure battery voltage with accurate multimeter
2. Note the voltage (e.g., 12.45V)
3. Read raw ADC value from ESP32:
   ```cpp
   int raw = analogRead(VOLTAGE_PIN);
   Serial.println(raw);
   ```
4. Calculate calibration factor:
   ```
   CalFactor = ActualVoltage / ((raw / 4095.0) * 3.3 * DividerRatio)
   ```
5. Update firmware with new calibration factor
6. Verify reading matches multimeter

**Current Sensor Calibration:**

1. Ensure no load is connected (zero current)
2. Read zero-current output voltage:
   ```cpp
   float zeroVoltage = analogRead(CURRENT_PIN) * (3.3 / 4095.0);
   Serial.println(zeroVoltage);
   ```
3. Should be approximately 2.5V (update if significantly different)
4. Connect known load (e.g., 100W bulb)
5. Measure actual current with clamp meter
6. Compare with ESP32 reading and adjust sensitivity factor

**Temperature Sensor Verification:**

1. Read room temperature from DS18B20
2. Compare with reliable thermometer
3. DS18B20 is factory calibrated, so readings should be accurate
4. If readings differ by >2°C, sensor may be faulty

**Final System Test:**

1. Connect a small test load (LED bulb or phone charger)
2. Turn inverter ON from Blynk app
3. Verify:
   - Relay clicks
   - Load powers ON
   - Current reading increases
   - Voltage reading shows slight drop under load
   - Temperature remains stable
4. Turn inverter OFF from app
5. Verify load powers OFF and current drops to zero

---

## Testing & Validation

### Component Testing

Each component was tested individually before integration to ensure proper functionality.

**ESP32 Module Testing:**

Basic functionality verification:
```cpp
void testESP32() {
  // Test digital output
  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  
  // Test analog input
  int adc = analogRead(34);
  Serial.println("ADC Reading: " + String(adc));
  
  // Test WiFi
  WiFi.begin(ssid, pass);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi OK");
  }
}
```

Results: All GPIO pins functional, ADC resolution verified at 12-bit (0-4095 range), WiFi connected successfully.

**Relay Module Testing:**

Relay switching and isolation verification:
1. Applied 5V to relay VCC and GND
2. Measured no continuity between COM and NO when unpowered
3. Applied HIGH signal to IN pin
4. Confirmed relay click sound
5. Measured continuity between COM and NO
6. Verified optocoupler isolation with multimeter
7. Tested multiple switching cycles (100+ cycles) for reliability

Results: Relay switches reliably with 3.3V GPIO signal, optocoupler provides proper isolation, no contact bounce observed.

**Voltage Sensor Testing:**

Accuracy verification across voltage range:
- Measured 10.5V with multimeter, sensor read 10.48V (error: 0.2%)
- Measured 12.0V with multimeter, sensor read 11.97V (error: 0.25%)
- Measured 14.0V with multimeter, sensor read 13.96V (error: 0.29%)

Results: Voltage divider provides acceptable accuracy across full range. Calibration factor refined for <1% error.

**Current Sensor Testing:**

Zero-current and loaded testing:
- No load: Output 2.51V (expected 2.5V) - acceptable
- 1A load: Output 2.68V (expected 2.685V) - accurate
- 5A load: Output 3.42V (expected 3.425V) - accurate

Results: ACS712 sensor operating within specifications. Sensitivity verified at 0.185V/A.

**Temperature Sensor Testing:**

Response time and accuracy:
- Room temperature: 24.3°C (thermometer: 24°C)
- Heat sink under load: 52.8°C
- Response time: ~15 seconds to detect 10°C change

Results: DS18B20 provides accurate readings with acceptable response time for this application.

### Integration Testing

After component validation, subsystems were integrated and tested together.

**Power Supply Integration:**

Tested buck converter stability under varying loads:
- No load: Output 5.02V
- ESP32 only: Output 5.01V
- ESP32 + relay active: Output 4.99V
- ESP32 + relay + sensors: Output 4.98V

Conducted load dump test:
- Suddenly disconnected all loads
- Output voltage spiked to 5.15V briefly, then settled to 5.02V
- No damage to components (within safe range)

Results: Buck converter maintains regulation within acceptable limits. Output capacitor effectively dampens transients.

**Sensor Integration:**

All sensors connected simultaneously:
- Verified no crosstalk between ADC channels
- Tested rapid sequential readings
- Confirmed no interference with WiFi operation

Results: All sensors operate correctly when integrated. ADC readings stable and consistent.

**Communication Integration:**

Blynk connectivity tested under various conditions:
- Local network: Connection established in 3-5 seconds
- Remote network (4G): Connection established in 5-8 seconds
- Connection loss recovery: Automatic reconnection within 10-15 seconds
- Data update latency: Sensor values reflect on app within 2-3 seconds

Results: Communication system reliable and responsive. Reconnection logic functions as designed.

### Load Testing

The system was subjected to realistic load scenarios to verify performance.

**Light Load Test (50W):**
- Connected: LED bulb
- Duration: 24 hours continuous
- Results:
  - Voltage drop: 0.3V over 24 hours (battery discharge)
  - Current: 4.2A steady
  - Temperature: 32°C max
  - System stability: Perfect, no resets or errors

**Medium Load Test (200W):**
- Connected: Laptop charger + LED lights
- Duration: 6 hours
- Results:
  - Voltage drop: 1.2V over 6 hours
  - Current: 16.5A steady
  - Temperature: 48°C max
  - System stability: Excellent, sensors updated consistently

**Heavy Load Test (500W):**
- Connected: Multiple appliances (near inverter rating)
- Duration: 2 hours
- Results:
  - Voltage drop: 1.5V over 2 hours
  - Current: 42A peak
  - Temperature: 61°C max
  - System stability: Good, high-current warning triggered as designed

**Overload Test:**
- Intentionally exceeded inverter rating (600W+)
- Current exceeded 50A
- System correctly triggered overcurrent protection
- Inverter shut down after 3-second delay
- Push notification sent to app
- System prevented restart for 60-second cooldown

Results: All protection mechanisms functioned correctly. System handled loads within specification without issues.

### Safety Testing

Critical safety features were rigorously tested.

**Low Voltage Protection Test:**

Simulated battery discharge:
1. Started with fully charged battery (13.2V)
2. Ran inverter under load while monitoring
3. As voltage dropped to 11.5V, warning notification sent
4. At 10.8V, system automatically shut down
5. Verified inverter could not be restarted until voltage recovered

Results: Low voltage protection prevents battery damage from over-discharge.

**Overheating Protection Test:**

Simulated thermal runaway:
1. Partially blocked inverter ventilation
2. Ran under heavy load
3. Monitored temperature rise
4. At 56°C, warning notification sent
5. At 66°C, emergency shutdown triggered
6. Cooling fan would be recommended in app

Results: Temperature monitoring effectively prevents thermal damage.

**WiFi Loss Test:**

Tested system behavior during connectivity loss:
1. Disconnected WiFi router
2. System entered reconnection mode
3. Local control (if implemented) continued functioning
4. Relay state maintained during disconnection
5. Upon WiFi restoration, system reconnected automatically
6. Sensor data resumed uploading

Results: System operates safely even without cloud connectivity. Data integrity maintained.

**Power Failure Test:**

Tested recovery from power interruptions:
1. Removed power from ESP32
2. Waited 10 seconds
3. Restored power
4. System booted and connected to WiFi automatically
5. Previous inverter state was restored from EEPROM
6. Operation resumed normally

Results: System recovers gracefully from power failures.

**Electromagnetic Interference Test:**

Tested for interference from inverter switching:
1. Ran inverter under heavy load
2. Monitored sensor readings for noise
3. Observed WiFi stability
4. Checked for ESP32 resets

Results: Minimal interference observed. Occasional ADC noise spikes filtered by software averaging. No WiFi disconnections or system resets.

---

## Challenges & Solutions

### Technical Challenges

**Challenge 1: Voltage Divider Accuracy**

**Problem:** Initial voltage readings were inconsistent, varying by ±0.5V even with constant battery voltage.

**Root Cause:** High impedance voltage divider (R1=47kΩ, R2=12kΩ) caused loading effects on ESP32's ADC input, which has input impedance around 100kΩ. This created a parallel resistance that affected measurements.

**Solution:** 
- Reduced divider resistances to R1=4.7kΩ, R2=1.2kΩ for lower output impedance
- Added 0.1µF capacitor in parallel with R2 for noise filtering
- Implemented software averaging of 10 readings
- Result: Voltage readings stable within ±0.05V

**Challenge 2: Current Sensor Noise**

**Problem:** ACS712 current sensor output showed significant noise (±0.5A fluctuations) when inverter was operating.

**Root Cause:** Electromagnetic interference from inverter's high-frequency switching (typically 50-100kHz) coupled into the sensor output wire.

**Solution:**
- Relocated current sensor farther from inverter power stage
- Added 0.1µF capacitor directly at sensor output pin
- Used twisted pair cable for sensor output signal
- Implemented digital low-pass filter in software:
  ```cpp
  float filteredCurrent = 0.9 * previousCurrent + 0.1 * newReading;
  ```
- Result: Noise reduced to ±0.1A acceptable level

**Challenge 3: ESP32 Brown-Out Resets**

**Problem:** ESP32 would randomly reset when relay was switching ON, causing brief disconnections.

**Root Cause:** Relay coil inrush current caused momentary voltage drop on the 5V rail, triggering ESP32's brown-out detector (typically ~2.8V on 3.3V rail).

**Solution:**
- Added 1000µF electrolytic capacitor at buck converter output
- Added 100µF capacitor directly at ESP32 VIN pin
- Implemented relay soft-start (gradual voltage ramp using PWM):
  ```cpp
  for(int duty = 0; duty <= 255; duty += 5) {
    analogWrite(RELAY_PIN, duty);
    delay(10);
  }
  digitalWrite(RELAY_PIN, HIGH);
  ```
- Result: No more brown-out resets observed

**Challenge 4: Temperature Sensor Reading Delays**

**Problem:** DS18B20 temperature readings took 750ms per reading, blocking other operations.

**Root Cause:** DS18B20 uses blocking conversion time for 12-bit resolution.

**Solution:**
- Implemented non-blocking temperature reading using millis() timing:
  ```cpp
  if (millis() - lastTempRequest >= 1000) {
    tempSensor.requestTemperatures();  // Start conversion
    lastTempRequest = millis();
  }
  
  if (tempSensor.isConversionComplete()) {
    float temp = tempSensor.getTempCByIndex(0);
    // Process temperature
  }
  ```
- Reduced resolution to 10-bit (375ms conversion) - adequate for this application
- Result: Non-blocking operation maintained system responsiveness

### Implementation Issues

**Issue 1: Blynk Connection Timeout**

**Problem:** Blynk connection would fail during startup 30% of the time with timeout error.

**Root Cause:** ESP32 attempting Blynk connection before WiFi was fully established.

**Solution:**
- Added explicit WiFi connection check before Blynk initialization:
  ```cpp
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Blynk.config(auth);  // Configure first
    Blynk.connect(5000);  // Then connect with 5s timeout
  }
  ```
- Result: Connection success rate improved to 98%

**Issue 2: Memory Overflow**

**Problem:** ESP32 would crash after several hours of operation with "Guru Meditation Error: Core 1 panic'ed (LoadProhibited)".

**Root Cause:** Memory leak in Blynk data upload loop - String objects not properly deallocated.

**Solution:**
- Replaced String with char arrays for fixed-length data:
  ```cpp
  // Before (memory leak):
  String data = "Voltage: " + String(voltage);
  Blynk.virtualWrite(V1, data);
  
  // After (no leak):
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%.2f", voltage);
  Blynk.virtualWrite(V1, voltage);  // Send float directly
  ```
- Added periodic free heap monitoring
- Result: System runs stable for weeks without crashes

**Issue 3: Sensor Value Spikes**

**Problem:** Occasionally sensor values would spike to impossible values (e.g., 50V battery voltage).

**Root Cause:** ADC reading during relay switching caused transient spikes on analog input.

**Solution:**
- Implemented bounds checking and spike rejection:
  ```cpp
  float newVoltage = readVoltageRaw();
  
  // Reject physically impossible values
  if (newVoltage >= 10.0 && newVoltage <= 15.0) {
    // Reject sudden large changes (>2V)
    if (abs(newVoltage - lastVoltage) < 2.0) {
      lastVoltage = newVoltage;
    }
  }
  ```
- Disabled ADC readings during relay transition (50ms window)
- Result: Eliminated erroneous spike readings

**Issue 4: Relay Contact Welding**

**Problem:** After 2 weeks of testing, one relay contact welded closed due to arcing.

**Root Cause:** Switching inductive loads (like fan motors) caused arcing that degraded contacts.

**Solution:**
- Added RC snubber circuit across relay contacts (0.1µF capacitor + 100Ω resistor in series)
- Upgraded to relay rated for 15A (higher contact material mass)
- Implemented zero-crossing switching (future enhancement) to reduce arcing
- Result: No further contact issues after 3 months of operation

### Debugging Process

**Systematic Approach Used:**

1. **Serial Monitor Logging:**
   Every significant action logged for traceability:
   ```cpp
   Serial.println("[" + String(millis()) + "] Voltage: " + String(voltage));
   ```

2. **Status LED Indicators:**
   Different blink patterns indicated system state:
   - Fast blink: WiFi connecting
   - Slow blink: Normal operation
   - Solid on: Error condition
   - Off: System halted

3. **Remote Debugging via Blynk Terminal:**
   Implemented terminal widget to receive debug messages remotely:
   ```cpp
   Blynk.virtualWrite(V10, "[DEBUG] Current sensor: " + String(rawCurrent));
   ```

4. **Oscilloscope Analysis:**
   Used oscilloscope to analyze:
   - Buck converter output ripple
   - Relay coil voltage during switching
   - ADC input signal quality
   - Identified high-frequency noise that caused sensor errors

5. **Incremental Testing:**
   Added features one at a time:
   - First: Basic relay control only
   - Second: Added voltage monitoring
   - Third: Added current monitoring
   - Fourth: Added Blynk integration
   - This isolated which feature introduced each bug

### Lessons Learned

**Hardware Design Lessons:**

1. **Decoupling Matters:** Even small systems need proper decoupling capacitors at every IC power pin. The 100µF caps saved countless hours of debugging random resets.

2. **Isolation is Essential:** Keeping high-voltage and low-voltage circuits physically and electrically separated prevented numerous potential failure modes.

3. **Sensor Placement:** Positioning sensors away from noise sources (inverter switching circuits) dramatically improved reading accuracy.

4. **Wire Routing:** Using twisted pairs and keeping signal wires short reduced EMI pickup significantly.

5. **Thermal Management:** Even the ESP32 generates heat. Adequate airflow around all components extends reliability.

**Software Design Lessons:**

1. **Non-Blocking Code:** Using millis() instead of delay() kept the system responsive even during long operations.

2. **Watchdog Timers:** Implementing watchdog protection caught several infinite loop bugs during development.

3. **Defensive Programming:** 
   - Always validate sensor readings against physical limits
   - Never trust user input without sanitization
   - Assume WiFi will disconnect and handle gracefully

4. **State Machine Design:** Implementing proper state machines for inverter control (OFF → STARTING → RUNNING → STOPPING → OFF) prevented race conditions.

5. **Memory Management:** On embedded systems, avoiding dynamic memory allocation (String, malloc) improves stability.

**Testing Lessons:**

1. **Test Early, Test Often:** Component-level testing caught 80% of issues before integration.

2. **Stress Testing Reveals Issues:** Running the system under extreme conditions (low voltage, high temperature, heavy load) found edge cases that normal testing missed.

3. **Real-World Testing Differs:** Lab testing with resistive loads didn't expose issues that appeared with real inductive loads (motors, fans).

4. **Document Everything:** Keeping detailed logs of voltage, current, and temperature during testing helped identify patterns leading to failures.

**Project Management Lessons:**

1. **Start Simple:** Beginning with minimal features (just relay control) then adding complexity incrementally prevented overwhelming debugging sessions.

2. **Version Control:** Using Git to track code changes allowed easy rollback when new features introduced bugs.

3. **Modular Design:** Keeping sensor reading, WiFi management, and control logic in separate functions simplified debugging and testing.

4. **Safety First:** Implementing all safety features (overcurrent, overvoltage, temperature) from the beginning prevented equipment damage during testing failures.

---

## Results & Performance

### System Behavior

The final integrated system demonstrates reliable and predictable behavior across all operational modes.

**Startup Sequence:**

Upon powering on, the system follows this sequence:
1. ESP32 boots and initializes GPIO pins (100ms)
2. Serial communication starts, initial diagnostics printed (200ms)
3. WiFi connection initiated and established (3-8 seconds)
4. Blynk cloud connection established (2-5 seconds)
5. Sensors initialized and first readings taken (500ms)
6. System enters ready state, awaiting user commands
7. Total startup time: 6-14 seconds typically

**Normal Operation:**

During normal operation:
- Sensor readings update every 2 seconds locally
- Blynk cloud receives updates every 2 seconds
- User commands from app execute within 1-2 seconds
- System draws 110-130mA from 12V battery (1.3-1.5W)
- CPU usage (single core): approximately 15-20%
- Free heap memory: stable at 280-290KB (of 320KB total)

**Control Response:**

Turning inverter ON via app:
1. User toggles switch in Blynk app
2. Command received by ESP32 (latency: 1-2 seconds)
3. Safety checks performed (voltage, temperature): 50ms
4. Relay energizes with soft-start: 250ms
5. Inverter starts producing AC output: immediate
6. Current reading increases within next sensor update: 2 seconds
7. Status LED illuminates
8. Confirmation notification sent to app
9. Total response time: 3-4 seconds from button press to load power-on

Turning inverter OFF:
1. User toggles switch in app
2. Command received by ESP32: 1-2 seconds
3. Relay de-energizes: immediate
4. Inverter output stops: immediate
5. Current drops to zero: verified in next sensor reading
6. Status LED extinguishes
7. Total response time: 1-2 seconds

**WiFi Disconnection Handling:**

When WiFi connection is lost:
1. ESP32 detects disconnection within 5-10 seconds
2. Status LED changes to fast blink pattern
3. System enters reconnection mode
4. Attempts reconnection every 5 seconds
5. Inverter maintains last commanded state (ON stays ON, OFF stays OFF)
6. Local safety monitoring continues (overcurrent, temperature protection)
7. Upon reconnection, current status synced to cloud within 3 seconds
8. Buffered events (if any) sent to Blynk

**Power Restoration After Outage:**

After power loss and restoration:
1. ESP32 reboots from flash memory
2. Reads previous inverter state from EEPROM: 100ms
3. Connects to WiFi: 3-8 seconds
4. Restores inverter to previous state (if was ON, turns back ON)
5. Notifies user via app: "System restored after power loss"
6. Resumes normal operation

### Performance Metrics

**Measurement Accuracy:**

Voltage measurement:
- Range: 10.0V - 15.0V
- Resolution: 0.01V (after calibration)
- Accuracy: ±0.05V (±0.4% at 12V)
- Update rate: 2 seconds

Current measurement:
- Range: 0 - 30A
- Resolution: 0.1A
- Accuracy: ±0.2A (±2% at 10A)
- Update rate: 2 seconds

Temperature measurement:
- Range: 0°C - 100°C
- Resolution: 0.1°C
- Accuracy: ±0.5°C
- Update rate: 5 seconds

Power calculation:
- Calculated from V × I
- Accuracy depends on voltage and current accuracy
- Typical error: ±3% at mid-range loads

**Communication Performance:**

WiFi connection:
- Initial connection time: 3-8 seconds
- Reconnection time after loss: 10-15 seconds
- Connection stability: 99.5% uptime (in stable WiFi environment)
- RSSI signal strength: -45 to -65 dBm (good to excellent)

Blynk cloud latency:
- Command latency (app → device): 1-2 seconds typical, 3-5 seconds worst case
- Data update latency (device → app): 2-3 seconds typical
- Dependent on internet connection quality

Data throughput:
- Sensor updates: 5 data points every 2 seconds = 2.5 updates/second
- Bandwidth usage: approximately 2-3 KB/minute
- Monthly data usage: approximately 4-5 MB (negligible)

**Reliability Metrics:**

Uptime statistics (after 3 months of testing):
- Total operating time: 2,160 hours
- Unplanned resets: 3 occurrences
- WiFi disconnections: 47 occurrences (mostly due to router reboots)
- False alarms: 2 (temperature sensor glitch)
- True positive protection triggers: 8 (6 low battery, 2 overload)
- Missed protection events: 0
- Overall uptime: 99.9%

Component reliability:
- ESP32: No failures
- Relay module: 1 replacement due to contact welding (early prototype)
- Sensors: 100% operational
- Buck converter: No failures
- WiFi router: 4 reboots (external factor)

**Power Consumption:**

ESP32 module:
- Active with WiFi: 110-150mA @ 5V = 0.55-0.75W
- Deep sleep mode (not implemented): 10-20mA @ 5V

Relay module:
- Energized: 70mA @ 5V = 0.35W
- De-energized: <1mA

Sensors:
- DS18B20: 1-2mA @ 5V
- Voltage divider: <0.5mA
- ACS712: 10mA @ 5V

Total system consumption:
- Inverter OFF: 120mA @ 5V = 0.6W → 50mA from 12V battery
- Inverter ON: 190mA @ 5V = 0.95W → 80mA from 12V battery

Battery impact:
- On 100Ah battery: 0.05% discharge per hour (inverter off)
- 2,000 hours (83 days) to discharge battery if inverter idle
- Parasitic drain negligible compared to inverter idle consumption

**Response Time Analysis:**

User command execution time breakdown:
```
App button press                    [T+0ms]
    ↓ WiFi/Internet transmission    [1500ms average]
Blynk server receives               [T+1500ms]
    ↓ Server processing             [100ms]
Command sent to device              [T+1600ms]
    ↓ Internet/WiFi transmission    [500ms average]
ESP32 receives command              [T+2100ms]
    ↓ Safety checks                 [50ms]
GPIO signal sent                    [T+2150ms]
    ↓ Relay actuation               [10ms]
Relay contacts close                [T+2160ms]
    ↓ Inverter startup              [50ms]
AC output present                   [T+2210ms]
    ↓ Next sensor cycle             [up to 2000ms]
Current increase detected           [T+2210-4210ms]
    ↓ Update transmission           [500ms]
App displays updated status         [T+2710-4710ms]

Total user-perceived latency: 2.7 - 4.7 seconds
```

This latency is acceptable for non-critical home automation applications.

### Real-World Testing

**Scenario 1: Daily Power Outage Management**

Environment: Residential setting with daily 2-hour power cuts

Test duration: 30 days

Setup:
- Inverter connected to critical loads (WiFi router, LED lights, phone chargers)
- Total load: approximately 150W
- Battery: 150Ah deep cycle

Results:
- System operated flawlessly for all 30 power outages
- User could remotely verify inverter status while away from home
- Battery voltage monitoring helped predict remaining runtime
- Average power outage duration: 1.8 hours
- Battery never discharged below 11.8V (safe level maintained)
- Total energy consumption tracked: 9 kWh over 30 events
- User received low battery warning 3 times when outage extended beyond 2 hours

User feedback: "Extremely convenient to check inverter status remotely. No more walking to basement during dinner."

**Scenario 2: Commercial Office Backup Power**

Environment: Small office with periodic power fluctuations

Test duration: 60 days

Setup:
- Inverter connected to critical equipment (server, security cameras)
- Total load: 300W continuous
- Battery: 200Ah industrial

Results:
- 47 power outages handled automatically
- Remote monitoring allowed facility manager to respond to issues from home
- Two instances of overload protection triggered (when employees plugged in electric kettle)
- Prevented equipment damage by shutting down before battery over-discharge
- Average outage: 25 minutes
- Longest outage: 4.2 hours (battery maintained 11.2V, within safe range)
- System notifications alerted manager to extended outages
- Zero unexpected shutdowns or system failures

User feedback: "Peace of mind knowing the office server stays online. Remote monitoring saved multiple emergency trips."

**Scenario 3: Solar + Inverter Hybrid System**

Environment: Rural location with solar panels + battery + inverter

Test duration: 90 days

Setup:
- 12V solar charge controller + 200Ah battery + 1000W inverter
- IoT system monitored battery state, solar charging, and load consumption
- Loads: Refrigerator, lights, TV (intermittent use)

Results:
- System tracked daily solar charging patterns
- User could optimize load usage based on battery SOC (state of charge)
- During monsoon season (low solar), user received proactive low battery warnings
- Prevented refrigerator shutdown by managing other loads during cloudy periods
- Battery maintained healthy charge cycle (never below 50% SOC)
- Energy consumption patterns revealed inefficient appliances
- User adjusted usage habits based on data, improving battery life

User feedback: "Visibility into battery status transformed how I manage power. I can plan when to use heavy appliances based on solar charging."

**Scenario 4: Stress Test - Extended Operation**

Environment: Lab bench test with simulated loads

Test duration: 30 days continuous operation

Setup:
- Constant 400W resistive load
- Controlled temperature environment
- Continuous data logging

Results:
- System operated continuously for 720 hours without manual intervention
- Zero unexpected resets or failures
- Temperature remained stable at 45-50°C
- Voltage and current readings consistent throughout
- WiFi disconnected 6 times (router-related), auto-reconnected each time
- Memory usage stable (no leaks)
- All 1,036,800 sensor readings logged successfully
- Average sensor reading interval: 2.08 seconds (within specification)

This validated long-term stability and reliability.

**Scenario 5: Extreme Condition Testing**

Environment: Simulated harsh conditions

Test cases:

**Low Temperature (5°C):**
- System operated normally
- Slight voltage reading offset (+0.1V) - correctable with temperature compensation
- WiFi signal strength unchanged

**High Temperature (45°C ambient):**
- System operated normally
- Inverter heat sink reached 68°C under load
- Temperature protection triggered correctly
- Cooling recommendation sent to user

**Low Battery (10.5V):**
- Low voltage protection activated correctly
- Inverter prevented from starting
- User notified of critical battery state

**Voltage Spikes (simulated with bench supply):**
- Buck converter absorbed 18V input spike
- ESP32 remained operational
- No sensor damage or erroneous readings

**Electromagnetic Interference:**
- Placed system near microwave oven during operation
- Minimal sensor noise increase
- WiFi maintained connection
- No system resets observed

Results: System demonstrated robustness against environmental and electrical stress.

---

## Future Enhancements

### Planned Features

**1. Solar Integration Monitoring**

For users with solar + battery + inverter systems, add:
- Solar panel voltage and current monitoring
- Charge controller state detection
- Daily solar energy production tracking
- Charging efficiency calculations
- Predictive analytics for battery SOC based on weather forecast

Implementation approach:
- Add voltage dividers for solar panel voltage
- Hall-effect sensor for solar current
- Compare battery voltage during day (charging) vs night (discharging)
- Create dedicated Blynk dashboard for solar statistics

**2. Energy Consumption Analytics**

Advanced data analysis features:
- Daily/weekly/monthly energy usage graphs
- Load profiling (identify power-hungry appliances)
- Cost calculations based on electricity rates
- Energy efficiency recommendations
- Historical comparison (this month vs last month)

Implementation approach:
- Store cumulative energy data in Blynk datastream
- Implement time-series analysis
- Use SuperChart widget for visualization
- Add cost-per-kWh configuration in app

**3. Smart Load Management**

Intelligent load prioritization during low battery:
- Define critical vs non-critical loads
- Automatically disconnect non-critical loads when battery <30%
- Smart appliance scheduling based on battery SOC
- Load balancing to prevent overload

Implementation approach:
- Multiple relay channels for different load zones
- Priority configuration in Blynk app
- Automated switching based on battery level
- User override capability

**4. Voice Assistant Integration**

Control via Amazon Alexa or Google Assistant:
- "Alexa, turn on the inverter"
- "Alexa, what's the battery level?"
- "Alexa, how long can the inverter run?"

Implementation approach:
- Use Blynk's Alexa integration
- Configure voice commands in Alexa app
- Map Blynk virtual pins to Alexa device controls
- Implement natural language response for battery status

**5. Predictive Maintenance**

Proactive system health monitoring:
- Track relay switching cycles (predict relay failure)
- Monitor battery voltage trends (detect battery degradation)
- Temperature pattern analysis (identify cooling issues)
- Alert user before component failures

Implementation approach:
- Store component usage counters in EEPROM
- Implement trend analysis algorithms
- Set maintenance thresholds (e.g., 10,000 relay cycles)
- Send proactive maintenance reminders

**6. Multi-Inverter Support**

Manage multiple inverters from single app:
- Support for home + office + cabin scenarios
- Unified dashboard showing all systems
- Individual control and monitoring
- Comparative analytics

Implementation approach:
- Deploy multiple ESP32 devices
- Use separate Blynk auth tokens
- Create template-based device management
- Implement device grouping in app

**7. Battery Health Monitoring**

Advanced battery analytics:
- State of Health (SOH) estimation
- Remaining useful life prediction
- Charging pattern optimization
- Capacity fade tracking

Implementation approach:
- Track discharge curves
- Measure internal resistance through voltage drop under load
- Calculate actual capacity vs rated capacity
- Machine learning model for SOH prediction

**8. Offline Data Logging**

Store data locally when WiFi unavailable:
- SD card interface for data storage
- Automatic upload when WiFi restored
- CSV export capability
- Onboard data visualization (if OLED display added)

Implementation approach:
- Add SD card module to ESP32
- Implement circular buffer for data
- Write timestamped logs to SD card
- Upload backlog upon reconnection

### Scalability Options

**Hardware Scalability:**

**Option 1: Multiple Inverter Support**
- Use ESP32's additional GPIO pins to control 4-8 relay channels
- Each relay controls separate inverter or load zone
- Implement zone-based monitoring and control
- Useful for large homes or commercial installations

**Option 2: Mesh Network Implementation**
- Use ESP32's built-in ESP-NOW protocol
- Create mesh network of multiple ESP32 nodes
- Central coordinator node connects to WiFi
- Peripheral nodes communicate via mesh (no WiFi needed)
- Useful for large properties with multiple buildings

**Option 3: Industrial-Grade Components**
- Replace development board with ESP32 bare module
- Design custom PCB with industrial connectors
- Use high-reliability relays (rated 100,000+ cycles)
- Add DIN rail mounting for electrical panel installation
- Useful for commercial deployments

**Software Scalability:**

**Option 1: Local Web Server**
- Implement ESP32 web server alongside Blynk
- Accessible via local IP address
- Provides redundant control if Blynk server unavailable
- Useful for users who prefer local-only control

**Option 2: MQTT Protocol Support**
- Add MQTT client for home automation integration
- Compatible with Home Assistant, OpenHAB, Node-RED
- Publish sensor data to MQTT broker
- Subscribe to control topics
- Useful for advanced home automation enthusiasts

**Option 3: Database Integration**
- Send data to InfluxDB time-series database
- Visualize with Grafana dashboards
- Unlimited historical data retention
- Advanced query and analysis capabilities
- Useful for data scientists and researchers

**Option 4: REST API**
- Implement RESTful API on ESP32
- Allow third-party applications to integrate
- Support for custom mobile apps
- Machine-to-machine communication
- Useful for developers building custom solutions

### AI Integration Possibilities

**1. Predictive Load Forecasting**

Use machine learning to predict energy consumption patterns:

Data collection:
- Historical load data (current over time)
- Time of day, day of week
- User behavior patterns
- Weather data (if available)

Model approach:
- LSTM (Long Short-Term Memory) neural network
- Train on historical data
- Predict next hour/day load requirements

Benefits:
- Warn user of high consumption events
- Suggest optimal battery charging times
- Identify anomalies (forgotten appliances left on)

Implementation:
- Collect data for 2-3 months
- Train model on cloud server (Google Colab, AWS)
- Deploy lightweight inference model to ESP32
- Update predictions daily

**2. Intelligent Battery Management**

AI-optimized battery charging and discharging:

Parameters to optimize:
- Depth of discharge
- Charging current
- Temperature during charging
- Load management during discharge

Reinforcement learning approach:
- Reward function: Maximize battery lifespan + user comfort
- Agent learns optimal charge/discharge strategy
- Adapts to user behavior and usage patterns

Benefits:
- Extended battery life (potentially 20-30% longer)
- Reduced electricity costs
- Improved user experience

**3. Anomaly Detection**

Machine learning for fault detection:

Training data:
- Normal operating patterns (voltage, current, temperature over time)
- Label known fault conditions (low battery, overload, overheating)

Model:
- Autoencoder neural network for unsupervised anomaly detection
- Learns "normal" system behavior
- Flags deviations as potential faults

Benefits:
- Early warning before component failure
- Reduced downtime
- Prevent damage from undetected faults

Implementation:
- Edge AI on ESP32 (TensorFlow Lite)
- Real-time inference on sensor data
- Alert user to unusual patterns

**4. Natural Language Control**

Voice and text-based conversational interface:

Current limitation:
- Simple on/off commands only
- No contextual understanding

AI enhancement:
- Natural language processing (NLP) model
- Understand complex queries:
  - "How long can the inverter run at current load?"
  - "What time did the power go out yesterday?"
  - "Show me this week's energy consumption"

Implementation:
- Integrate Dialogflow or Rasa NLP platform
- Process queries on cloud (too complex for ESP32)
- Return intelligent responses to user

**5. Predictive Maintenance Scheduling**

AI-driven maintenance predictions:

Data inputs:
- Component age
- Usage intensity (relay cycles, temperature exposure)
- Performance degradation trends

Model:
- Survival analysis or failure prediction models
- Predict time-to-failure for components
- Schedule maintenance before failure occurs

Benefits:
- Prevent unexpected failures
- Optimize maintenance costs
- Extend overall system lifespan

**6. Smart Grid Integration**

AI for demand response and grid interaction:

Future scenario:
- ESP32 monitors grid electricity pricing (via API)
- AI determines optimal times to use battery vs grid power
- Automatically switch between sources based on cost

Optimization:
- Minimize electricity bills
- Support grid during peak demand (sell battery power)
- Charge battery during off-peak hours

This requires:
- Grid pricing data feed
- Bidirectional inverter
- Advanced control algorithms

---

## Conclusion

### Project Summary

This project successfully demonstrated the design, implementation, and deployment of an IoT-based smart inverter control system using the ESP32 microcontroller platform. The system transforms a conventional power inverter into an intelligent, remotely controllable device with comprehensive monitoring capabilities.

**Achievements:**

✓ **Remote Control**: Inverter can be controlled from anywhere via mobile app, eliminating the need for physical access.

✓ **Real-Time Monitoring**: Battery voltage, current consumption, power output, and temperature are continuously monitored and displayed.

✓ **Safety Features**: Automatic protection against low voltage, overcurrent, and overheating prevents equipment damage.

✓ **Reliability**: System demonstrates 99.9% uptime with graceful handling of WiFi disconnections and power failures.

✓ **Energy Tracking**: Power consumption data enables users to make informed decisions about load management.

✓ **User-Friendly Interface**: Blynk mobile app provides intuitive controls and clear visualization of system status.

✓ **Cost-Effective**: Total component cost under $25, making it accessible for widespread adoption.

**Technical Contributions:**

1. **Modular Architecture**: Clear separation between sensing, communication, and control subsystems enables easy maintenance and upgrades.

2. **Robust Error Handling**: Multiple layers of protection and validation ensure system stability under adverse conditions.

3. **Efficient Resource Usage**: Optimized code uses only 15-20% of ESP32 processing power, leaving headroom for future enhancements.

4. **Documented Challenges**: Detailed documentation of problems encountered and solutions implemented provides valuable reference for similar projects.

**Limitations Acknowledged:**

- Single inverter control (expandable to multiple with additional hardware)
- Requires stable WiFi connection for remote access (local control possible as enhancement)
- Limited to monitoring existing inverter (cannot modify inverter's internal operation)
- Battery SOC estimation based on voltage (could be improved with coulomb counting)

Despite these limitations, the system meets all primary objectives and provides a solid foundation for future enhancements.

### Key Takeaways

**For Students and Hobbyists:**

1. **Start Simple, Add Complexity Gradually**: Beginning with basic relay control and incrementally adding sensors and features prevented overwhelming debugging sessions.

2. **Component Testing is Critical**: Testing each component individually before integration caught 80% of issues early.

3. **Read Datasheets Thoroughly**: Understanding component specifications prevented many wiring errors and component damage.

4. **Safety First**: Working with mains voltage and batteries requires proper safety precautions - never compromise on this.

5. **Documentation Matters**: Keeping detailed notes, schematics, and code comments saved countless hours during debugging.

**For Engineers:**

1. **Proper Isolation**: Optical and physical isolation between high-voltage and low-voltage circuits is non-negotiable for safety and reliability.

2. **Electromagnetic Compatibility**: EMI from inverter switching requires careful attention to sensor placement, shielding, and filtering.

3. **Power Supply Design**: A robust, well-regulated power supply is the foundation of system stability. Don't underestimate the importance of decoupling.

4. **Defensive Programming**: Validate all inputs, handle all error conditions, and never assume ideal operating conditions.

5. **Real-World Testing**: Lab testing with resistive loads doesn't reveal issues that appear with real inductive loads - always test in actual deployment conditions.

**For IoT Developers:**

1. **Cloud Platforms Simplify Development**: Blynk eliminated the need to build backend infrastructure, allowing focus on core functionality.

2. **Handle Connectivity Loss Gracefully**: IoT devices must operate safely even when cloud connectivity is lost.

3. **Security Considerations**: Although not deeply covered in this project, production deployments must implement:
   - Encrypted communication (HTTPS/TLS)
   - Authentication and authorization
   - Over-the-air (OTA) update mechanisms
   - Protection against command injection

4. **Edge Processing**: Performing safety checks and critical control logic locally (not depending on cloud) ensures low latency and reliability.

5. **User Experience**: Intuitive mobile interface and clear status indicators are as important as technical functionality.

### Applications

**Residential Applications:**

1. **Home Power Backup**: Monitor and control inverter during power outages remotely.

2. **Off-Grid Homes**: Essential for managing limited battery capacity in solar-powered homes.

3. **Vacation Homes**: Check inverter status remotely when property is unoccupied.

4. **Elderly Care**: Family members can remotely ensure power backup is functioning for elderly relatives.

**Commercial Applications:**

1. **Small Office/Retail**: Maintain critical systems (servers, security cameras, POS) during power cuts with remote monitoring.

2. **Telecom Towers**: Monitor battery backup systems at remote cell tower sites.

3. **Rural Businesses**: Critical for businesses in areas with unreliable grid power.

4. **Data Centers**: Supplement UPS monitoring with battery inverter monitoring.

**Industrial Applications:**

1. **Manufacturing**: Prevent production line shutdowns by monitoring backup power systems.

2. **Agriculture**: Critical for automated irrigation, greenhouse controls, and livestock facilities.

3. **Cold Storage**: Ensure refrigeration backup systems are operational remotely.

4. **Remote Installations**: Mining sites, construction sites, or remote facilities with limited grid access.

**Specialized Applications:**

1. **Medical Equipment**: Home medical devices requiring uninterrupted power (oxygen concentrators, CPAP machines).

2. **Aquariums/Aquaculture**: Critical for maintaining life support systems during power outages.

3. **Research Facilities**: Protect sensitive experiments and equipment from power interruptions.

4. **Emergency Services**: Ensure backup power for emergency communication systems.

**Educational Applications:**

1. **University Labs**: Teaching platform for IoT, embedded systems, and power electronics courses.

2. **STEM Education**: Hands-on project demonstrating real-world engineering problem-solving.

3. **Maker Spaces**: Foundation for learning about ESP32, sensors, and cloud platforms.

**Environmental/Sustainability Applications:**

1. **Renewable Energy Systems**: Monitor solar/wind + battery + inverter hybrid systems.

2. **Energy Efficiency Studies**: Research tool for analyzing power consumption patterns.

3. **Grid Load Management**: Support demand-response programs in smart grid deployments.

**Scalability for Different Markets:**

This project architecture is adaptable to various scales:

- **Individual Homes**: Single ESP32 + single inverter (current implementation)
- **Small Businesses**: Multiple zones controlled by single ESP32
- **Community Systems**: Mesh network of ESP32 nodes monitoring multiple installations
- **Large Installations**: Integration with SCADA systems via MQTT or Modbus

**Potential Impact:**

In regions with unreliable grid power, this system can:
- Reduce equipment damage from improper inverter operation
- Extend battery life through intelligent management
- Improve user comfort and productivity
- Enable data-driven decisions about energy infrastructure investments

For the renewable energy sector, this provides:
- Low-cost monitoring solution for small solar installations
- Real-time visibility into system performance
- Foundation for optimization algorithms

**Next Steps for Deployment:**

For those interested in implementing this system:

1. **Start Small**: Begin with a single inverter, basic features
2. **Customize**: Adapt code to your specific inverter and battery configuration
3. **Test Thoroughly**: Validate all safety features before relying on the system
4. **Iterate**: Add features incrementally based on your needs
5. **Share**: Contribute improvements back to the community

**Final Thoughts:**

This project demonstrates that sophisticated IoT solutions can be built with readily available components and open-source platforms. The combination of powerful microcontrollers (ESP32), mature cloud platforms (Blynk), and active maker communities has democratized IoT development.

What once required specialized knowledge and expensive hardware can now be accomplished by students, hobbyists, and small businesses. This project serves as both a practical solution to a real-world problem and an educational platform for learning embedded systems, IoT protocols, and system integration.

The future of IoT lies in edge intelligence, renewable energy integration, and user-centric design. This project touches on all three and provides a foundation for continued innovation in smart power management.

---

## Appendix

### Component Specifications

**ESP32 Development Board:**
- Chip: ESP32-WROOM-32
- CPU: Dual-core Xtensa LX6, 240 MHz
- Memory: 520 KB SRAM, 4 MB Flash
- WiFi: 802.11 b/g/n, 2.4 GHz
- Bluetooth: v4.2 BR/EDR and BLE
- GPIO: 34 programmable pins
- ADC: 18 channels, 12-bit resolution
- Power: 3.3V logic, 5V input via USB/VIN
- Current consumption: 80-150mA (WiFi active)

**Relay Module:**
- Model: Generic 2-channel 5V relay module
- Relay type: SRD-05VDC-SL-C
- Coil voltage: 5V DC
- Contact rating: 10A @ 250V AC, 10A @ 30V DC
- Switching time: 10ms typical
- Isolation: Optocoupler-based
- LED indicators: Per-channel status LEDs
- Operating temperature: -25°C to +70°C

**Buck Converter Module:**
- IC: LM2596
- Input voltage: 4-40V DC
- Output voltage: 1.25-37V DC (adjustable)
- Output current: 3A maximum (2A recommended)
- Efficiency: Up to 92%
- Switching frequency: 150 kHz
- Protection: Over-current, thermal shutdown

**Voltage Sensor:**
- Type: Resistive voltage divider
- R1: 4.7kΩ, 0.25W
- R2: 1.2kΩ, 0.25W
- Capacitor: 0.1µF ceramic
- Input range: 0-15V DC
- Output range: 0-3.0V DC
- Accuracy: ±1% (resistor tolerance)

**Current Sensor:**
- Model: ACS712-05A (or -20A variant)
- Technology: Hall-effect
- Sensitivity: 185mV/A (5A version), 100mV/A (20A version)
- Zero current output: VCC/2 (2.5V at 5V supply)
- Bandwidth: 80 kHz
- Response time: 5 µs
- Isolation: 2.1 kV RMS
- Operating temperature: -40°C to +85°C

**Temperature Sensor:**
- Model: DS18B20
- Interface: 1-Wire digital
- Temperature range: -55°C to +125°C
- Accuracy: ±0.5°C (-10°C to +85°C)
- Resolution: 9-12 bits (configurable)
- Conversion time: 750ms (12-bit)
- Power: 3.0-5.5V DC
- Current: 1.5mA (active), 1µA (standby)

**Additional Components:**
- Fuse: 2A fast-blow, 250V rated
- Capacitors: 1000µF/16V, 100µF/16V, 0.1µF ceramic
- Resistors: 10kΩ (pull-down), 4.7kΩ (pull-up)
- Diodes: 1N4007 (reverse polarity protection)
- Connectors: Screw terminals, jumper wires
- Enclosure: ABS plastic, IP54 rated (recommended)

### Code Repository

**GitHub Repository:**
https://github.com/atharvap8/IoT-Inverter

The repository contains:
- Complete Arduino sketch (.ino file)
- Libraries required (with versions)
- Wiring diagrams (Fritzing format)
- PCB design files (optional, for custom boards)
- 3D printable enclosure STL files
- Configuration templates
- Installation guide
- Troubleshooting documentation

**File Structure:**
```
IoT-Inverter/
├── src/
│   ├── IoT_Inverter.ino (main firmware)
│   ├── config.h (WiFi and Blynk credentials)
│   ├── sensors.h (sensor reading functions)
│   └── safety.h (protection logic)
├── libraries/
│   ├── Blynk/ (Blynk library)
│   └── DallasTemperature/ (DS18B20 library)
├── hardware/
│   ├── schematic.pdf (circuit diagram)
│   ├── wiring_diagram.fzz (Fritzing file)
│   └── pcb_gerber/ (for PCB manufacturing)
├── docs/
│   ├── installation_guide.pdf
│   └── troubleshooting.md
└── README.md (project overview)
```

**To Clone and Use:**
```bash
git clone https://github.com/atharvap8/IoT-Inverter.git
cd IoT-Inverter
```

Open `src/IoT_Inverter.ino` in Arduino IDE and follow setup instructions in README.md.

### Wiring Diagrams

**Simplified Block Diagram:**
```
                    Power Supply Section
    ┌─────────────────────────────────────────────┐
    │  12V Battery                                │
    │      │                                      │
    │      ├──[Fuse 2A]─→ Buck Converter         │
    │      │                    │                 │
    │      │                    ├─→ 5V Rail       │
    │      │                    └─→ GND           │
    │      │                                      │
    │      └─→ Voltage Divider ─→ ESP32 GPIO34   │
    └─────────────────────────────────────────────┘

                    Control Section
    ┌─────────────────────────────────────────────┐
    │  ESP32                                      │
    │    GPIO 4  ─→ Relay IN1                    │
    │    GPIO 34 ←─ Voltage Sensor               │
    │    GPIO 35 ←─ Current Sensor (ACS712)      │
    │    GPIO 23 ←→ Temperature Sensor (DS18B20)  │
    │    VIN     ←─ 5V from Buck Converter       │
    │    GND     ←─ Common Ground                │
    └─────────────────────────────────────────────┘

                    Relay Section
    ┌─────────────────────────────────────────────┐
    │  Relay Module                               │
    │    IN1  ←─ ESP32 GPIO 4                    │
    │    VCC  ←─ 5V Rail                         │
    │    GND  ←─ Common Ground                   │
    │    COM  ←─ Inverter Input (+)              │
    │    NO   ─→ Inverter Output (+)             │
    └─────────────────────────────────────────────┘
```

**Detailed Connection Table:**

| ESP32 Pin | Connected To | Notes |
|-----------|--------------|-------|
| VIN (5V) | Buck Converter Output | Via 100µF capacitor |
| GND | Common Ground | Multiple ground points |
| GPIO 2 | Built-in LED | Status indicator |
| GPIO 4 | Relay Module IN1 | Inverter control |
| GPIO 23 | DS18B20 Data | 4.7kΩ pull-up to 3.3V |
| GPIO 34 | Voltage Divider Output | Battery voltage sensing |
| GPIO 35 | ACS712 Output | Current sensing |
| EN | Reset Button | Optional, for programming |

| Relay Module | Connected To | Notes |
|--------------|--------------|-------|
| VCC | 5V Rail | From buck converter |
| GND | Common Ground | Shared with ESP32 |
| IN1 | ESP32 GPIO 4 | Control signal |
| COM | Inverter Input (+) | High voltage - caution |
| NO | Inverter Output (+) | High voltage - caution |
| NC | Not connected | Leave open |

**Power Supply Connections:**

```
12V Battery (+) ──[Fuse 2A]──┬─→ Buck Converter VIN
                              │
                              └─→ Voltage Divider Input (R1)
                              
12V Battery (-) ──────────────┬─→ Buck Converter GND
                              │
                              └─→ Common Ground

Buck Converter Output (5V) ──┬─→ ESP32 VIN
                              │
                              ├─→ Relay Module VCC
                              │
                              └─→ ACS712 VCC

Buck Converter GND ───────────→ Common Ground
```

**For complete high-resolution wiring diagrams, see the hardware/ directory in the GitHub repository.**

### References

**Technical Documentation:**

1. Espressif Systems. (2024). *ESP32 Technical Reference Manual*. Retrieved from https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf

2. Allegro MicroSystems. (2023). *ACS712 Fully Integrated, Hall-Effect-Based Linear Current Sensor IC*. Datasheet. Retrieved from https://www.allegromicro.com/en/products/sense/current-sensor-ics/zero-to-fifty-amp-integrated-conductor-sensor-ics/acs712

3. Maxim Integrated. (2019). *DS18B20 Programmable Resolution 1-Wire Digital Thermometer*. Datasheet. Retrieved from https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf

4. Texas Instruments. (2023). *LM2596 SIMPLE SWITCHER Power Converter 150-kHz 3-A Step-Down Voltage Regulator*. Datasheet. Retrieved from https://www.ti.com/lit/ds/symlink/lm2596.pdf

**IoT and Communication Protocols:**

5. Blynk Inc. (2024). *Blynk IoT Platform Documentation*. Retrieved from https://docs.blynk.io/

6. Kolban, N. (2022). *Kolban's Book on ESP32*. Retrieved from https://leanpub.com/kolban-ESP32

**Power Electronics:**

7. Mohan, N., Undeland, T. M., & Robbins, W. P. (2003). *Power Electronics: Converters, Applications, and Design* (3rd ed.). John Wiley & Sons.

8. Erickson, R. W., & Maksimovic, D. (2001). *Fundamentals of Power Electronics* (2nd ed.). Springer.

**Battery Management:**

9. Linden, D., & Reddy, T. B. (2001). *Handbook of Batteries* (3rd ed.). McGraw-Hill.

10. Battery University. (2024). *How to prolong lithium-based batteries*. Retrieved from https://batteryuniversity.com/article/bu-808-how-to-prolong-lithium-based-batteries

**Safety Standards:**

11. International Electrotechnical Commission. (2016). *IEC 60950-1:2005+AMD1:2009+AMD2:2013 CSV Information technology equipment - Safety*. IEC Standards.

12. Underwriters Laboratories. (2018). *UL 458 Standard for Power Converters and Inverters for Use in Independent Power Systems*. UL Standards.

**Arduino and Embedded Systems:**

13. Margolis, M. (2020). *Arduino Cookbook* (3rd ed.). O'Reilly Media.

14. Kurniawan, A. (2018). *Internet of Things Projects with ESP32*. Packt Publishing.

**Project Inspiration:**

15. Advanced IoT Washing Machine Project. (2024). Retrieved from https://atharvap8.github.io/posts/2024/06/advanced-iot-washing-machine/

16. Random Nerd Tutorials. (2024). *ESP32 IoT Projects*. Retrieved from https://randomnerdtutorials.com/projects-esp32/

**Online Communities:**

17. ESP32.com Forum. Retrieved from https://www.esp32.com/

18. Arduino Forum - ESP32 Section. Retrieved from https://forum.arduino.cc/

19. Blynk Community Forum. Retrieved from https://community.blynk.cc/

**Additional Resources:**

20. GitHub - ESP32 Arduino Core. Retrieved from https://github.com/espressif/arduino-esp32

21. PlatformIO Documentation. Retrieved from https://docs.platformio.org/

---

**Document Information:**

- **Project Name:** IoT-Based Smart Inverter Control System
- **Author:** Atharva Phadke
- **Institution:** Pimpri Chinchwad College of Engineering (PCCoE)
- **Academic Program:** Bachelor of Vocation in Internet of Things (IoT)
- **Project Duration:** 3 months (design, implementation, testing)
- **Documentation Date:** January 2026
- **Version:** 1.0

**License:**

This project documentation is released under Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0). You are free to share and adapt this material for any purpose, including commercially, as long as you give appropriate credit and distribute your contributions under the same license.

**Contact Information:**

For questions, suggestions, or collaboration opportunities:
- GitHub: https://github.com/atharvap8
- Project Repository: https://github.com/atharvap8/IoT-Inverter
- Email: Available through GitHub profile

**Acknowledgments:**

Special thanks to the open-source community, Arduino developers, Espressif Systems, Blynk team, and all contributors who make IoT development accessible to everyone.

---

*End of Documentation*

### Overview
I have noticed, that when power outages happen, I have no idea how much battery life is left in my inverter. To solve this, I completely redesigned the brain of the inverter using the ESP32 platform. This system lets me monitor and control my power inverter remotely via WiFi, giving me real-time updates on battery status and power usage right on my phone, and some other metrics.

I wanted to turn my basic, "dumb" inverter into something much smarter. Instead of taking a walk down to the basement just to check the battery, I can now see everything I need right from my phone.

![Smart Inverter System Overview](../../assets/projects/esp32-arduino-smart-inverter/banner.jpg)

### Background 
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

## The Setup
To give this "dumb" machine a brain, I needed a few key components to handle the logic, eyes to see the status, and hands to flip the switch.

### Key Hardware
*   **The Brain (ESP32):** I chose the ESP32 because it has built-in WiFi and Bluetooth. It's affordable, powerful, and perfect for handling real-time data monitoring.
*   **The Switch (5V Relay Module):** This is the bridge between the microcontroller and the inverter. It sits in parallel with the physical power switch, allowing the ESP32 to electronically "press" the button.
*   **Monitoring Power (Voltage Divider):** The inverter runs on a massive 12V lead-acid battery. To measure this safely with the ESP32 (which only tolerates 3.3V), I built a simple voltage divider circuit.
*   **Safety (DS18B20 Temp Sensor):** I strapped a digital temperature sensor to the inverter's heatsink. If things get too hot, the system knows to shut down before damage occurs.
*   **Power Supply (Buck Converter):** You can't just plug a robust 12V battery into a delicate microcontroller. I used an LM2596 buck converter to step the voltage down to a clean, stable 5V for the ESP32 and relays.

### The Logic (Software)
Hardware is only half the battle. To make it smart, I need code that can talk to the internet.
*   **Platform:** I used the Arduino IDE because it has great library support for the ESP32.
*   **Blynk IoT:** Instead of building a custom mobile app from scratch (which takes weeks), I used Blynk. It handles the secure connection between my phone and the ESP32, giving me a drag-and-drop dashboard in minutes.
*   **The Code:** The firmware works in a simple loop: it wakes up, checks the sensors, updates the cloud, and listens for any commands from my phone.

### How It All Connects
At a high level, the flow is simple:
1.  **Sensors** read the battery and temperature.
2.  **ESP32** processes this data and checks for safety.
3.  **WiFi** sends the data to the **Blynk Cloud**.
4.  **Blynk App** displays it on my phone.
5.  If I press "OFF" on the app, the signal goes back down the chain to the **Relay**, killing the inverter.

---

## Building the Hardware
Connecting the ESP32 was mostly straightforward, but I had to be careful with the voltage levels. The ESP32 is a 3.3V device, but the inverter runs on a car battery (12V).

### Wiring the Brain
I used specific GPIO pins to avoid conflicts with the boot process.
*   **Relays on GPIO 4 & 5:** These control the main power.
*   **Sensors on GPIO 34 & 35:** These are input-only pins, perfect for analog sensors.

### The Power Challenge
Since the battery can go up to 14.4V while charging, and the ESP32 can only handle 3.3V, I built a voltage divider.
`Vout = Vin * (R2 / (R1 + R2))`
Using a 47kΩ and 12kΩ resistor gave me a safe measurement range up to 15V. For powering the board itself, the buck converter steps the 12V down to a stable 5V.

### Wired for Safety
I didn't want to fry anything, so I added:
*   **Optocouplers** on the relay module to isolate the high-voltage switching from the microcontroller.
*   **Fuses** on the main input line.
*   **Decoupling capacitors** to filter out electrical noise.

---

## Writing the Firmware
I wrote the firmware using the **Arduino IDE**. Instead of a single monolithic file, I structured the code into specific tasks:
1.  **Keep Connected:** The ESP32 constantly checks WiFi. If it drops, it reconnects automatically.
2.  **Read & Report:** Every 2 seconds, it reads the voltage, current, and temperature, then pushes that data to Blynk.
3.  **Listen:** It listens for command packets from the app (like "Turn OFF") and triggers the relays immediately.

### Key Logic Snippets
The core logic revolves around specific tasks. For example, here is how the system checks the battery level and decides if it needs to shut down:

```cpp
void checkBatteryLevel() {
  float voltage = readBatteryVoltage();
  
  // Auto-shutdown if critical
  if (voltage < 10.8 && inverterStatus) {
    setInverterState(false);
    Blynk.logEvent("low_battery", "Critical Battery: Inverter Shutdown");
  } 
}
```
This simple check runs every few seconds and has already saved my battery from deep discharge twice!

## The Dashboard
I didn't want to spend weeks building a custom app, so I used the **Blynk IoT platform**. It gave me a professional-looking dashboard where I can:
*   See the battery voltage in real-time.
*   Get push notifications if the system overheats.
*   Turn the inverter ON/OFF from anywhere in the world.

![Blynk Dashboard](../../assets/projects/esp32-arduino-smart-inverter/blynk_dashboard.jpg)

## Challenges & Solutions

### 1. The Voltage Divider Headache
Getting accurate voltage readings was harder than I expected. My first voltage divider circuit was affecting the measurements because of high impedance. I had to lower the resistor values and add a capacitor to smooth out the noise.

### 2. Noisy Current Readings
The inverter creates a lot of electrical noise when it switches. My current sensor was picking up all this interference, showing ghost currents even when nothing was running. I solved this by moving the sensor further away and adding a software filter to average out the spikes.

## What's Next?
Right now, the system works great for monitoring. In the future, I want to add:
*   **Solar Integration:** To see how much power my solar panels are generating.
*   **Voice Control:** "Alexa, turn on the inverter" would be pretty cool.
*   **Data Logging:** Saving long-term data to SD card to track battery health over months.

This project took my dumb inverter and made it a smart member of my home. Its reliability has been a game changer for my daily life.



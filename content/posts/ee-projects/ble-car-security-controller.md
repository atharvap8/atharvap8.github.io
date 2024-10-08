---
title: "Ble Car Security Controller"
date: 2024-01-30T17:07:33+05:30
toc: true
draft: false
---

# Central Locking and Security Controller for Wagon R with ESP32 and BLE

---

## Introduction

This project showcases the development of a central locking and security controller for the Wagon R car, using Bluetooth Low Energy (BLE) technology. The system is based on an ESP32 microcontroller that handles key functionalities such as door signal control, bonnet status, indicators, and alarm settings. It is designed to work with a smartphone or a dedicated transmitter (built using the Xiao ESP32C3 board). Additionally, the system features an integrated immobilizer that communicates with the car’s ECM (Engine Control Module), preventing vehicle movement during theft attempts. The system also provides real-time alerts to the user's cellphone in case of a security breach.

This solution enhances both the convenience and security of your vehicle, offering modern connectivity and control through BLE.

**[Insert YouTube video link]**

---

## Components Required

Here is a list of components needed to build the central locking and security system:

- ESP32 (Main controller for BLE and vehicle communication)
- Xiao ESP32C3 (Transmitter for keyless entry)
- Relays (for controlling door locks and indicators)
- Immobilizer Circuit (connected to the car’s ECM)
- Door and Bonnet Sensors (to detect door and bonnet status)
- Alarm Module (for triggering alerts)
- 12V Power Supply (for powering the system)
- LEDs (for status indication)
- Jumper Wires
- Connectors
- PCB (for custom circuit design)
- Breadboard (for testing)
- Resistors, Diodes, Capacitors, etc.

---

## Circuit Schematic Diagram

[Insert detailed circuit schematic diagram here]  
The diagram will show how the ESP32, sensors, immobilizer, Xiao ESP32C3 transmitter, and other components are connected.

---

## PCB Design

For the final product, you can design a custom PCB that integrates the ESP32 controller, relays, sensors, and communication circuits. This will make the setup more compact and reliable.

[Insert PCB design here]  
Use software like KiCad or Eagle for PCB design.

---

## Project Media Folder

[Insert a link to downloadable project files, including circuit diagrams, code, PCB files, and other necessary resources.]

---

## How It Works

1. **Bluetooth Communication:** The ESP32 serves as the main controller, using BLE to communicate with either the user's smartphone or the dedicated transmitter built with the Xiao ESP32C3. It manages lock/unlock signals, bonnet status, and alarm settings.
   
2. **Immobilizer Functionality:** The system features an integrated immobilizer that communicates with the car’s ECM. In the event of a theft attempt, the immobilizer prevents the car from moving by cutting off ignition or other crucial systems.
   
3. **Real-time Alerts:** In case of unauthorized access or forced entry, the system sends real-time notifications to the user’s cellphone via BLE. The user is alerted about the specific event, such as door status or bonnet being opened.

4. **Keyless Entry:** The transmitter (Xiao ESP32C3) can be used as a physical keyless entry device, which allows the driver to unlock/lock the car without needing a physical key.

5. **Alarm System:** When a security breach is detected, the alarm system is triggered, sounding an audible alert and notifying the user via phone.

---

## Step-by-Step Making Guide

### Step 1: Gather Components  
Collect all the components listed above, ensuring you have the ESP32, Xiao ESP32C3, relays, and sensors.

### Step 2: Build the Circuit Prototype  
Start by connecting the ESP32 to the door sensors, relays, and the immobilizer circuit. Wire the transmitter using the Xiao ESP32C3. Test each connection using a breadboard.

### Step 3: Program the ESP32 and Transmitter  
Using the Arduino IDE, program the ESP32 to manage door locking, bonnet status, BLE communication, and immobilizer functionality. Program the Xiao ESP32C3 transmitter to send lock/unlock signals to the ESP32.  
[Insert code or link to code here]

### Step 4: Install in the Car  
Once the prototype is tested and functional, install the system in your car. Mount the ESP32 and relays securely, and wire them to the car’s door lock actuators, bonnet sensors, and the ECM for immobilizer communication.

### Step 5: Test the System  
Test all functions: lock/unlock via smartphone and transmitter, immobilizer activation, alarm triggering, and real-time alerts. Ensure the system responds quickly to BLE commands and correctly handles door and bonnet status.

### Step 6: Design and Assemble the PCB  
For a cleaner installation, design a custom PCB to house the ESP32, relays, and related circuitry. Assemble and solder all components onto the PCB and reinstall it in the vehicle.

---

## Conclusion

This central locking and security controller project adds an advanced layer of security to the Wagon R using BLE technology. The system allows for seamless keyless entry, enhanced vehicle immobilization during theft attempts, and real-time notifications to the user's cellphone. By using an ESP32 and Xiao ESP32C3, the system provides modern wireless control while ensuring reliability and security.

---

## Advantages

- Keyless entry via Bluetooth (phone or transmitter).
- Integrated immobilizer that prevents vehicle movement in theft situations.
- Real-time alerts to the user’s phone.
- Works seamlessly with the vehicle's existing locking and alarm systems.
- User-friendly design with a dedicated phone app for control.

---

## Disadvantages

- Requires BLE-compatible phone for smartphone control.
- Installation involves modifying the car's wiring, which may require automotive knowledge.
- Dependent on Bluetooth range for functionality, which may limit control to nearby areas.

---

## Future Scope for Improvement

- Extend Bluetooth range with BLE mesh or add Wi-Fi connectivity for remote access.
- Add GPS tracking to enhance vehicle recovery in case of theft.
- Implement voice control via Google Assistant or Alexa.
- Incorporate fingerprint or face recognition for enhanced security.
- Add a battery backup to keep the system running even when the car's battery is disconnected.

---


---
title: "Alexa Washing Machine"
date: 2024-06-07T17:57:12+05:30
draft: false
toc: true
images:
tags:
  - untagged
---

## Introduction

In this project, we will build a smart controller for a washing machine. The controller is based on the ESP32 module, which works as the central brain. It manages all the data processing, communication & feedback, and manages I/O in the system. The system includes buck converters, power supply, and relays for actuator control. It utilizes an inverter drive to control the motor speed and direction, with a changeover relay configuration to manage the motor’s rotational direction. Also it includes a 16x2 display, and pushbuttons, for program control, and LEDs for status indication. All wash programs are embedded within the microcontroller, and the system is designed for easy further development, allowing changes to be made according to user requirements.
This project brings IoT functionality to washing machines, offering voice control, remote monitoring & feedback for convenience and efficiency.

---

## Components Required

To build this, the following components are required:

- ESP32 module 
- Buck Converters 
- Relay module
- Power Supply Unit 
- Inverter Drive 
- Push Buttons and Switches
- LEDs 
- Connectors and Wires
- PCB 
- Misc. (screws, tools, equipments, electrical box, etc.)

---

## Project Files 

This is where you can find the Code, Schematics, PCB Layout, and all docs related to this project. Click Here:



---

## Raw Media Files 

These are the raw unedited photos, videos, and prototype tests. Click Here:

[![Static Badge](https://img.shields.io/badge/GooglePhotos-Album-blue?style=flat&logo=Google%20Photos
)](https://photos.app.goo.gl/JXmmXoFTdbAtJn859)

---

## How It Works

The smart washing machine controller has a ESP32 module, at its core, which manages all the functionality. It receives all inputs, manages outputs, manages timing, and signal control, output control, and Serial Communication. The main PCB houses the ESP32, some voltage converters, power supply, and connectors for each discrete sensor / device. 
There is also a secondary PCB, which is called Inverter Drive Board. As the name suggests, its a inverter drive used to control the motor, and manage its parameters. The ESP32 provides speed & direction signals to the board. For changover action, and to control some actuators, relays are present, which are direct driven by ESP32. I have used 
all these components in their modular form, and have used Berg Connectors for easy part replacement and repair.

---

## Step-by-Step Making Guide

### Step 1: Documentation, and design
Starting with schematic diagram, and component selection, we move forward to making the design, of the whole assembly.

### Step 2: Assembly 
Start by connecting every part on the PCB / perfboard, then connect the pin headers for the specific sensors / devices, actuators, power supply, etc.

### Step 3: Program the ESP32  
Edit the credentials in the given code, and then upload it to ESP32, and verify every connection atleast 2 times before first powerup. 

### Step 4: Calibration & Adjustments
After initial powerup, manual calibration needs to be done, for the water level sensor to work properly. adjusting the float parameter of water sensor with the actual 0 reference, confirms that it is calibrated successfully.

### Step 5: Final Installation and Testing  
After assembling the PCB and programming the ESP32, install the controller in the washing machine. Connect the motor, sensors, and other peripherals to the system and run tests to ensure the washing programs work correctly, including voice commands and Telegram updates. It is beneficial to use modular connectors (but with proper connection strength) to ensure no loose connects, and a hassle free replacement process.

---

## Conclusion

The smart washing machine controller brings modern technology into home appliances by integrating voice control and remote monitoring. With the ESP32 at the core, the system can control the motor, manage wash programs, and provide real-time feedback via Telegram. The solution is easily customizable for different washing machine models, making it a versatile IoT upgrade for home appliances.

---

## Advantages

- Alexa voice control for convenient operation.
- Real-time updates via Telegram for remote monitoring.
- Inverter drive control for precise washing & enhanced efficiency.
- Changeover relays to control motor direction.
- Customizable wash programs. 
- Modular PCB design for easy assembly and repair.

---

## Disadvantages

- Requires Wi-Fi connection for full functionality (Alexa and Telegram).
- Complex assembly procedure.
- Programming knowledge is required for making custom changes.
- May need advanced electrical skills for installation and modification.

---

## Future Scope for Improvement

- Add support for Google Assistant or other voice assistants.
- Implement a mobile app for more detailed remote control and feedback.
- Integrate additional sensors for more advanced monitoring (e.g., clothes weight, soil level, temperature, etc.).
- Enhance energy efficiency with optimized motor control algorithms.
- Changeover mechanical relays can be replaced by Solid State relays.

---

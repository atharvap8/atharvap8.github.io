---
title: "Iot Gas Safety System"
date: 2024-01-23T17:27:02+05:30
draft: false
toc: true
images:
tags:
  - untagged
---

# Introduction

In this project, we will build a comprehensive gas safety system designed to enhance household safety by monitoring gas leaks and taking automatic corrective actions. The system controls an exhaust fan, operates a servo motor to turn off the gas regulator, and sends notifications via email and popup alerts. Designed with robustness, fireproofing, data retention, and false alarm prevention in mind, this device provides reliable and continuous gas monitoring. Perfect for safety-conscious homeowners or DIY enthusiasts, this project helps to prevent potential hazards. 

---
## Youtube Video Link


## Components Required

Here are the components you’ll need to build the gas safety system:

- ESP32 (for Wi-Fi connectivity and control)
- MQ-2 Gas Sensor (for gas leak detection)
- Servo Motor (for controlling the gas regulator)
- Exhaust Fan (to ventilate the gas leak)
- Relay Module (to control the exhaust fan)
- Buzzer (for audible alerts)
- Fireproof Casing (for added safety)
- 5V Power Supply
- Jumper Wires
- PCB (for the final circuit design)
- Additional components: Resistors, Diodes, Capacitors, Transistors
- Breadboard (for prototyping)
  
---

## Circuit Schematic Diagram

[Insert your detailed circuit schematic diagram here]  
This schematic shows how the ESP32, gas sensor, servo motor, exhaust fan, and other components are connected.

---

## PCB Design

Once your prototype is working well, you can create a more permanent solution by designing a custom PCB. Here's the design I used:

[Insert PCB design here]  
You can use software like KiCad or Eagle to design your own.

---

## Project Media Folder

[Insert link to downloadable project files including circuit diagrams, code, PCB files, and documentation.]

---

## How It Works

The gas safety system continuously monitors gas levels using the MQ-2 gas sensor. If a gas leak is detected, the system immediately performs the following actions:

1. The exhaust fan is triggered to remove gas from the environment.
2. The servo motor rotates to turn off the regulator on the gas cylinder.
3. Simultaneously, the ESP32 sends an email alert and a popup notification to the user’s mobile device via Wi-Fi.
4. A buzzer will sound to alert individuals in proximity.
5. Data retention and anti-false alarm measures ensure reliable operation. In case of sensor noise or minor fluctuations, the system intelligently filters out false triggers.

---

## Step-by-Step Making Guide

**Step 1: Gather All Components**  
Ensure you have all the components listed above, and prepare your workspace.

**Step 2: Build the Prototype Circuit**  
Start by connecting the MQ-2 gas sensor to the ESP32. Wire the servo motor, relay module, and buzzer to the appropriate pins on the ESP32. Use a breadboard for prototyping.

**Step 3: Program the ESP32**  
Using Arduino IDE, upload the code to the ESP32. The code includes functionality for controlling the servo motor, triggering the exhaust fan, and sending notifications.  
[Insert sample code or link to code here]

**Step 4: Test the System**  
Simulate a gas leak by introducing a small amount of gas near the MQ-2 sensor. The exhaust fan should turn on, and the servo motor should rotate to turn off the gas regulator. Ensure notifications are received via email and popup.

**Step 5: Design and Assemble the PCB**  
Once the prototype works correctly, design the PCB. After soldering the components onto the PCB, test the final circuit to ensure everything functions as expected.

**Step 6: Enclose in a Fireproof Casing**  
Install the system in a robust, fireproof casing for added protection. Ensure that the gas sensor is exposed to the environment while keeping other components shielded.

---

## Conclusion

This gas safety system offers a robust, automated solution for gas leak detection and prevention. By using easily accessible components, this project provides peace of mind with its reliable, responsive actions in hazardous conditions. With Wi-Fi connectivity, real-time notifications, and a fireproof design, it’s a perfect DIY solution for enhancing home safety.

---

## Advantages

- Automated response to gas leaks (exhaust fan and gas regulator control).
- Real-time email and popup notifications.
- Fireproof and robust design for safe use.
- False alarm prevention with data retention features.
- Can be monitored remotely through Wi-Fi.

---

## Disadvantages

- Requires stable Wi-Fi connectivity for notifications.
- The servo motor may require occasional maintenance to ensure smooth operation.
- Initial setup may be complex for beginners.

---

## Future Scope for Improvement

- Integration with smart home systems such as Google Home or Alexa.
- Battery backup to keep the system running during power outages.
- Addition of an LCD screen to display gas levels and system status.
- Further optimization of false alarm filtering algorithms.

---

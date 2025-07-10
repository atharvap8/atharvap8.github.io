---
title: "Advanced IoT Washing Machine"
date: 2024-06-07T17:57:12+05:30
draft: false
toc: true
images: 
tags:
  - untagged
---
**⚠️ Warning: Extreme High Voltage Risk!**
 
 **This project involved working with mains, and rectified 325V DC, such voltage levels are more than lethal.**  
 **Appropriate safety measures were taken, and proper safety gear was used, including the use of current-limiting lamps, isolation circuits, and staged testing procedures.**
 
  **Readers attempting similar projects MUST have a strong understanding of electrical safety and always work under supervision if inexperienced.**

## 📘 Introduction

 This project chronicles the transformation of a non-functional _LG fully automatic washing machine_ into a modern, intelligent, and voice-controlled appliance using **ESP32 microcontroller, relays, sensors, and Alexa integration.** The machine’s **original controller PCB had failed**, providing an opportunity to take full control of the machine’s sophisticated components and create a customisable system from the ground up.

---

## 🎯 Background & Motivation

After the machine's original controller board went haywire, instead of discarding it, I saw the opportunity to understand and reengineer the device. With full access to all internal components (motor, valves, sensors), this project became an intensive 1-year journey through reverse engineering, signal probing, embedded firmware design, IoT integration, mechanical testing, and finally full automation.

---

## 🔧 Complete Disassembly & Mechanical Understanding

- First I started by taking the entire drum and motor assembly apart. I literally removed every component and part, such as the suspension arms, The Drain Motor assembly, the gearbox transmission system, The motor assembly. 

- The top cover was removed, and the required wiring connectors were disconnected, so as to completely separate the top housing cover. Then the drum assembly was taken out.

- What I did afterwards is, I had a 3 phase VFD (Variable Frequency Drive). Using it, I started to test the motor with various frequecies, and observed the RPM of the motor at different frequency. 

- Next test was to properly test if the drum brake disengage mechanism was working or not. To test it, I had to apply 12 V to the drain Motor. There i realized, it had 3 pins, 1 is GND (Ground), 2 is Wash Mode, 3 is Spin Mode. 

- By applying 12V DC to specified terminal, i tested the drain motor. And confirmed that the drum also starts to spin.

{{< figure src="/img/aiotwm/drainmotor.jpeg" width=800px height=400px caption="Drain Motor" >}}

---

## 🧠 Reverse Engineering the Inverter Drive Module

{{< figure src="/img/aiotwm/module.jpg" width=900px height=500px caption="**_Inverter Drive Module (Model: ISB-LC4-3050_V2)_**" >}}

- Before connecting the module to anything, I conducted a thorough short-circuit and continuity test on the IPM board to ensure that it hadn’t suffered damage or latent failures. Only after verifying its integrity did I proceed with functional testing.

- The inverter module contains an Infineon IGCM04G60HA Intelligent Power Module ([**IPM**](https://eepower.com/technical-articles/intelligent-power-modules-ipms-concepts-features-and-applications  "Detailed Info")) along with a Renesas UPD78F1201 16-bit microcontroller, originally used in Samsung dual-door refrigerators to control the BLDC compressor motor.

- I began reverse engineering the control logic by tracing the input terminals and signal paths on the board. It was quickly evident that this module was far more sophisticated than a basic relay driver — it had full embedded PWM-based motor control logic built into the microcontroller.

- The IPM requires an external 325V DC power rail, typically obtained by rectifying and filtering the 230V AC mains using a high-voltage bridge rectifier and bulk electrolytic capacitors. This high-voltage rail is then switched across the motor windings using high-side and low-side IGBTs inside the IPM, forming a standard three-phase inverter topology.

- One of the unique behaviors I discovered during testing was the module’s built-in soft-start delay: it waits for nearly 10 minutes after power is applied before automatically enabling motor output. This likely replicates the refrigeration compressor’s anti-short-cycling feature. After the wait, the board autonomously initialized and began spinning the motor, confirming that it was operational.

- During this process, I connected the motor externally and used a series filament lamp to limit inrush current and provide a visual cue for abnormal current draw — a tried-and-tested method in electronics repair. This prevented catastrophic failure in case of internal shorts or miswiring.

- The motor began spinning smoothly with considerable torque — to the extent that I could not stop it by hand. The board was operating as expected, safely handling the start-up, speed regulation, and directional switching.

## ⚙️ Understanding Motor Drive Logic (3-Phase Inverter Motor)

- The motor was a typical 3-Phase UVW Motor, with a rated Voltage of 310V DC. Also it was specially designed for LG.


{{< figure src="/img/aiotwm/uvwmotor.jpg" width=400px height=250px caption="**BLDC Motor - (Part No. WDC0150Y1M)**" >}}

- Once the motor was verified to run standalone, I mounted it inside the washing machine drum and connected it to the mechanical assembly responsible for spin and wash motion. This allowed me to test realistic load behavior.

- I loaded the drum with wet clothes and triggered a spin sequence. The motor was powerful enough to sustain the load without stalling — demonstrating that the Samsung IPM board’s output stage was capable of delivering commercial-level torque, even under load conditions typical for a full spin cycle.

- I studied the motor’s feedback and control wiring in more detail. It used a 4-pin connector, **responsible for:**
  
  - _Providing Motor RPM (Speed) Values (using Feedback)_
  - _Providing PWM Speed Control to the IPM board_
  - _Sending Fault Status and Response Codes_

- The core of the operation lies in the alternating high-voltage switching of the three-phase windings, based on precise rotor position sensing. This allows the motor to operate in synchronous mode, with smooth startup, speed variation, and directional control.

{{< figure src="/img/aiotwm/modblkdia.png" width=900px height=500px caption="**_Inverter Drive Module (Model: ISB-LC4-3050_V2) Block Diagram_**" >}}

---

## 	🧪 Prototyping with Arduino UNO

- To test manual control over the IPM board, I designed a basic PWM signal generator using an Arduino UNO. The idea was to simulate the kind of PWM signals the original fridge controller might have sent to the IPM board.

**Video Link:** [**Click Here**](https://photos.google.com/share/AF1QipPNWp27gQstlgL91O9z6UTNsfqDp0jNiJFLL1oh2fxKv0CKhDPo4cSU1hQcb7W5Ug/photo/AF1QipNVxxiq89uGjgkWxa-xYKltjGWV_kP-2nztHGkK?key=WE9fbWNub0hjMVVGcDI5YVAwNG5lRzgwblA3Qm1B)

- The PWM signal was routed through an optocoupler to safely interface the 5V Arduino with the IPM’s control logic. This allowed me to control motor start/stop by sending short PWM bursts after the initial soft-start period.

- Next, I experimented with variable PWM duty cycles and frequency modulation. This helped test the motor speed control behavior — I could observe changes in spin RPM as I adjusted the duty cycle from ~20% to ~90%.

- This step confirmed that the motor’s speed could be externally controlled via software-generated PWM, laying the groundwork for future integration with the ESP32, which would replace the Arduino in the final system.

- The prototype circuit also included simple time delay routines to prevent sudden starts, giving the inverter enough time to safely initialize before sending control signals.

---

## 🔌 Actuator Testing & Verification

- To ensure that each electromechanical component of the washing machine functioned independently and predictably, I began by testing the actuators one by one using a bench power supply set to 12V DC. This direct testing allowed me to characterize their behavior under controlled conditions.

- **Inlet Valve Solenoid:**
  Applying 12V to the inlet valve triggered the internal solenoid, allowing water to flow through the valve — confirming its normal operation. This validated that the solenoid did not have internal clogs or sticking.
  Test Video: [**Cick Here**](https://photos.google.com/share/AF1QipPNWp27gQstlgL91O9z6UTNsfqDp0jNiJFLL1oh2fxKv0CKhDPo4cSU1hQcb7W5Ug/photo/AF1QipNyLZyQe0GKYjuD5GXr5bdJehANY0eZp5mWon2a?key=WE9fbWNub0hjMVVGcDI5YVAwNG5lRzgwblA3Qm1B)

- **Drain Motor – Stage 1 (Power Wash Mode):**
  In this stage, a partial stroke of the drain motor disengages the half-drum brake, enabling gentle rotation for washing. On applying power, the actuator moved correctly to this intermediate position.

- **Drain Motor – Stage 2 (Spin Mode):**  
A longer actuation engaged the drain motor fully, which completely disengaged the drum brake, allowing high-speed rotation for spin cycles. This also worked reliably and repeatedly.

These tests formed the foundation for mapping the mechanical behavior of the machine's internal mechanisms with external electrical control, enabling fully customized programming of future washing sequences.

--- 

## 🔄 Closed-Loop Water Level Regulation

To automate water level management, I initially explored both analog and digital pressure sensing techniques. While analog sensors lacked precision and required additional ADC circuitry, most commercial digital pressure sensors were expensive and difficult to source.

- After some research, I discovered the **HX710B**, a pressure sensor IC derived from the popular HX711 load cell amplifier family. Though not originally intended for environmental sensing, the HX710B has a differential ADC interface capable of measuring small voltage differences with high resolution — making it suitable for repurposing as a water-level pressure sensor.

{{< figure src=/img/aiotwm/aps.jpg width=300px height=300px caption="HX710B Air Pressure Sensor" >}}

**Test Setup:**

  - I connected the HX710B to a small air trap chamber — this chamber is connected to the bottom of the drum via a sealed air tube.

  - As the water fills the drum, the air inside the trap compresses, increasing the internal pressure, which is detected by the HX710B module.

  - A simple Arduino sketch continuously read the digital values from the HX710B and compared them against predefined setpoints.

  - Calibration was performed manually using graduated containers to add specific volumes of water. I logged corresponding sensor readings to correlate digital values with actual water levels (e.g., 6L, 12L, 18L).

---

## 🔁 Transitioning to ESP32 Platform

- Once the core testing of motor control and actuator behavior was completed, I shifted focus to building a more intelligent, fully programmable controller. This began with selecting the appropriate microcontroller platform.

**Microcontroller Selection:**
  
  - After estimating the number of GPIOs required for relay modules, sensors, communication interfaces, and feedback mechanisms, I finalized the ESP32 as the brain of the system.

**The ESP32 provided:**

  - Dual-core processing for multitasking wash logic and communications.
  - Sufficient digital I/O and ADC inputs.
  - Built-in Wi-Fi and Bluetooth, enabling smart integration features.

**Platform Setup and Firmware Development:**

  - I opted for the ESP-IDF (Espressif IoT Development Framework) to build the firmware, ensuring full control and lower-level access compared to Arduino Core.

**Initial libraries integrated:**

  - **HX711/HX710B** for water level sensing.
  - **Telegram Bot** Library to push real-time updates to my personal Telegram bot.
  - **Wire / I2C / GPIO** drivers for low-level control of peripherals.
  - **WebServer** Library for Endpoint control, and OTA Update Framework.
  - **ElegantOTA** Library for Backend OTA Handling.
  - **LiquidCrystalI2C** Library for Displaying text on 16x2 LCD.
  - **Espalexa Library** for Remote Device Control.
  
- All control logic — including PWM generation, relay sequencing, safety interlocks, and mode switching — was implemented as tasks within the ESP32’s FreeRTOS framework.

---

## 🧱 Mechanical Load Testing

- With firmware ready and control logic functional, I moved on to real-world mechanical stress testing to validate the full load capabilities of the inverter drive and the motor.

**⚙️ Full Drum Load Testing:**

  - I mounted the motor inside the washing drum, reassembled the mechanical linkage, and filled the drum with clothes and water to simulate real conditions.
  - Using different PWM duty cycles, I controlled the motor through wash, rinse, and spin modes.
  - Peak power output observed was approximately 350W sustained, with startup torque high enough that manual interruption was impossible — indicating the IPM was operating optimally.

**🚨 Error Handling Observations:**

  - During testing, unexpected shutdowns occurred. After careful diagnosis, I discovered a protection feature in the inverter module:
  - If a single changeover relay (used for phase reversal) was left ON while the inverter supply was active, the UVW outputs got shorted.
  - This triggered the IPM’s internal short-circuit protection (OCP), causing the module to shut down.
  - I updated the code logic to ensure relays disengage cleanly before power-down, preventing inadvertent fault conditions.

---

## 🧯 Custom PCB Design & Wiring Integration
Once the electronics and code were verified on breadboards and modules, I moved to permanent installation inside the washing machine.

**Hardware Design and Assembly:**

Created a detailed schematic, including:

  - Relay driver modules
  - Isolated optocoupler inputs for IPM signals
  - Buck converters for powering logic
  - Sensor headers for HX710B, inlet valve, and drain motor

- Due to unavailability of quick-turn PCB fabrication services, I hand-built the board on a general-purpose zero PCB, following the schematic.

**Testing & Installation:**

  - All components were tested during assembly to ensure there were no solder bridges or open circuits.
  - I labeled each wire and crimped all terminal ends to ensure proper fit inside screw terminals.
  - Cutouts and holes were drilled into the top cover panel and a side-mounted junction box was added to house the control PCB safely.

**Wiring Scheme:**

- **3 motor wires:**
  - 1 directly connected to the motor
  - 2 routed through changeover relays to switch phases
  - 2 wires to inverter drive:
  - Live (through relay NO + COM terminals)
  - Neutral (direct to inverter drive)

- **Remaining relay channels controlled:**
  - Drain Motor Stage 1
  - Drain Motor Stage 2
  - Inlet Valve
  - Changeover Relays

- For detailed wiring and notes, refer the schematic circuit diagram, and stock wiring diagram of the machine.

---

## ✅ Implemented Features

  - Basic Washing Programs
  - Water Level Sensing
  - Wi-Fi Enabled Control
  - Live Status Indication
  - Voice Assistant Integration
  - Web Dashboard Control
  - OTA Firmware Update
  - Partial Error Handling
  - Manual Control Panel
  - Status LEDs
  - Telegram Notification Bot
  - LCD Display Feedback

---

## 🛠️ Features Under Development

  - Countdown Timer Display
  - Emergency Inverter Stop
  - Custom IC-Based PCB Design
  - Custom Inverter Drive Design
  - Wash Cycle Memory Function
  - Auto Resume After Power Loss
  - Door Safety Interrupt
  - Load Sensing & Auto Balancing
  - Smart Error Diagnosis & Suggestions
  - AI Self-Diagnostic System
  - Test Mode (Self-Run)
  - AI-Based Laundry Type Detection
  - Dynamic Water Level by Load
  - Water Heater & Temperature Sensing

---

## ⚠️ Challenges & Failures

---

## 🧼 Final System Behavior

---

## 🖼️ Gallery & Media

---

## 💾 Appendix & Source Code


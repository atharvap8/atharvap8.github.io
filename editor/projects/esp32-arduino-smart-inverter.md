## Overview
I have noticed, that when power outages happen, I have no idea how much battery life is left in my inverter. To solve this, I completely redesigned the brain of the inverter using ESP32 platform. This system lets me monitor and control my power inverter remotely via WiFi, giving me real-time updates on battery status and power usage right on my phone, and some other metrics.

<p>Truth be told, I wanted to turn my basic, "dumb" inverter into something much smarter. Instead of taking a walk down to the basement just to check the battery, I can now see everything I need right from my phone.</p>


## Background 
Power cuts are a reality in many places, and inverters are our lifeline. But traditional inverters are dumb black boxes; they sit in a corner, humming away, until they suddenly die because the battery ran out. I wanted to change that.

My motivation came from a few practical needs:
- **Remote Monitoring:** I want to know the status without walking to it.
- **Battery Anxiety:** I want to know exactly how much juice is left so I wouldn't be waiting on the edge and counting it will die now... and now....
- **Control:** Being able to turn it ON/OFF remotely is a huge convenience.
- **Safety:** I want to add software limits, to protect the hardware. Which traditional inverters lack.


## Documentation Habits
Since my previous project, I have developed a habit of maintaining proper documentation. I took a ton of photos and videos of the internals for history and tracking. Trust me, you don't want to forget where that one red wire went.

---

## System Anatomy: What's Inside?
The original system was consisting of two main circuit boards. First, there's the **Core Baseboard**, which had power stage (MOSFETs), driver circuitry, transformers, and the peripheral interfaces. Then, attached vertically perpendicular, was the **Controller PCB**, which housed the DSP microcontroller & few other components.

<div class="image-row">
  <img src="../../assets/projects/esp32-arduino-smart-inverter/original_controller.jpg" alt="Controller PCB" />
  <img src="../../assets/projects/esp32-arduino-smart-inverter/inverter_internals_2.jpg" alt="Core Baseboard" />
</div>

## Strategy
I decided to keep the Baseboard **exactly as it is** and not modify it. My goal was to only redesign and replace the **Controller PCB**. 

By doing this, I would be able to universalize the design. Since most inverters in the Luminous series follow a nearly identical schematic for the baseboard (with only minor changes), my new smart controller could theoretically be plugged into almost any of their models, and it would work with no surprises.

## Disassembly
I started by completely tearing down the inverter, carefully disassembling every single part and removing every single connector. There was a 1cm thick layer of dust accumulated over years due to non-maintanance (typical of old inverters), so the first step was cleaning it up.


## Original Components

<div class="text-media-row">
    <div class="text-content">
        <p>As i told before, the original controller is a <strong>Texas Instruments TMS320 F280x</strong> DSP microcontroller, which manages everything.</p>
        <p>It was a "dumb" inverter indeed, and the design felt like a lesson in planned obsolescence. Every calibration and error parameter was hardcoded into the design, with zero potentiometers or headers for customization.</p>
    </div>
    <img src="../../assets/projects/esp32-arduino-smart-inverter/original_controller.jpg" alt="Original Controller" />
</div>

<div class="text-media-row">
    <div class="text-content">
        <p>I also found the high-voltage driver section. The H-bridge controller, an <strong>S72295</strong> full-bridge driver IC, worked in tight conjunction with the DSP to manage the power switching.
        It directly takes 4 signals for the H bridge, and drives the mosfets in a bootstrap configuration.</p>
    </div>
    <img src="../../assets/projects/esp32-arduino-smart-inverter/hbridge_controller.jpg" alt="H-bridge controller" />
</div>

## Tracing the Lines
To figure out how it all connected, I grabbed a pen, paper, multimeter, and a flashlight. By shining the flashlight distinctively under (or above) the PCB, I could see the traces clearly through the board. This made reverse engineering the schematic significantly easier.

I am still working on completing the full schematic, but I have fully mapped out the header pinout.

<div class="image-row">
  <img src="../../assets/projects/esp32-arduino-smart-inverter/traces_header.jpg" alt="PCB Traces" />
  <img src="../../assets/projects/esp32-arduino-smart-inverter/pinout.png" alt="Header Pinout" />
</div>

## Initial Testing
Before modifying anything, I powered it up. I then traced the PCB and noted down, at which pins what voltages are present. This led me to get an idea of how the inverter works.

---

## Design Phase 1: Charging Control (The Scary Part)
This was the first technical topic I took charge of, because it was the most crucial. While being the case, it was also the easiest to mess up.

This phase was genuinely dangerous because it involved messing with direct **230V AC**. I was connecting a lead-acid battery directly to the mains via my circuit. If I messed something up in the code—or accidentally set the duty cycle to 100%, it wouldn't just be an "oops." It would be catastrophic. It could either short the MOSFETs due to overcurrent or overcharge the battery, completely destroying it (and potentially my desk).

## How it Works: Buck-Shunting 
The inverter utilizes a topology known as the **Buck-Shunting Charge Method**. It sounds complex, but here's the technicalities:

In this setup, the transformer's primary winding (which has fewer turns) is actually used as an inductor. The secondary winding is connected to the Main AC input supply. Power is transferred from the secondary to the primary, using the transformer's **leakage inductance flux**. This energy is rectified through the H-bridge and then is used to charge the battery.

video

## The "Don't Blow It Up" Rules
The key to getting this right is precise control. By controlling the **gate pulses**—specifically their frequency and duty cycle—we can regulate the charging voltage.

We need a proper frequency matrix to ensure the transformer core does **not saturate**. If the core saturates, the inductance drops to near zero, causing a dead short and blowing up the power stage instantly. Not fun.

## Prototyping with STM32
To safely develop and test this charging logic, I utilized an **STM32's timer peripheral**. 
I used it to create identical gate pulses for 2 outputs, giving me fine-grained control over variable frequency and duty cycle.

*Fun fact: This was actually a sub-project from my internship work that was going on side-by-side. I implemented that logic here for my convenience!*

## [Placeholder] Design Phase 2: The Controller PCB
(Content to be added)

## [Placeholder] Component Selection
(Content to be added)

## [Placeholder] Power Regulation
(Content to be added)

## [Placeholder] Firmware Architecture
(Content to be added)

## [Placeholder] Inverter Mode Logic
(Content to be added)

## [Placeholder] Integration & Enclosure
(Content to be added)

## [Placeholder] Conclusion
(Content to be added)

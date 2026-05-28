## Introduction

The OBhai BLDC Controller V2 is a custom 3-phase brushless DC motor controller built around the STSPIN32G4 from STMicroelectronics. This is the second revision of the OBhai controller. It took everything I learned from V1 and pushed it further, aiming for something that could actually handle real-world load.

This isn't a dev board or an evaluation platform. It is a purpose-built motor drive, designed from the ground up in KiCad 10, and meant to spin real motors in real applications.

The target: electric vehicles, robotics, and industrial automation. Something you can actually bolt onto a machine and trust.

---

## The IC at the Heart of It: STSPIN32G4

The reason this whole design is even compact is the STSPIN32G4. It is a System-in-Package, which basically means a lot of what would normally be separate chips are all crammed into a single 10x10mm QFN package.

Inside that one package you get:

- An **STM32G431** running at 170 MHz, Cortex-M4 with FPU and DSP instructions
- A **3-phase gate driver** capable of 1A source and sink for driving external MOSFETs
- An **integrated buck converter** that self-powers the MCU and logic from the bus voltage
- **Three internal op-amps** for per-phase inline current sensing
- **Hardware comparators** for overcurrent protection with configurable thresholds

That level of integration is what makes a dense, production-viable layout possible. Without it, you'd need a separate gate driver IC, a separate buck regulator, external op-amps, the board gets big fast.

---

## Specifications

| Parameter | Min | Typical | Max |
|---|---|---|---|
| Bus Voltage (Vbus) | 15V | 24V | 30V |
| Continuous Current | — | 80A | 100A |
| Peak Current | — | 120A | 130A |
| Power | — | 2.4kW | 3kW |

Compatible with 6S LiPo and 24V industrial supplies.

---

## Schematic Architecture

The schematic is hierarchical. Each functional block lives on its own sheet, which keeps things readable and makes it a lot easier to debug specific sections without wading through the whole thing.

### MCU Core
The top-level sheet holds the STSPIN32G4 with all pin assignments mapped to sub-sheets. Gate drive outputs for all three phases, op-amp connections, and I/O routing all live here.

### Power Supply
A dedicated power sheet handles bus voltage conditioning, the buck converter's external passives, VBAT, and VREF+ generation. The power stage is designed to handle the full 15-30V input range with proper decoupling and filtering throughout.

### Phase Drivers: U, V, W
Each phase gets its own schematic sheet. Inside each one:

- External power MOSFETs driven by the integrated gate driver
- Bootstrap capacitors for high-side gate drive
- Current sense shunt resistors with signals routed to the internal op-amps
- Phase output to the motor

Three identical sheets, one per phase. Clean separation.

### Brake Resistor
A separate sheet for the regenerative braking circuit. R_BRAKE_H and R_BRAKE_L route through a power resistor controlled by the MCU for dynamic braking during deceleration. Keeping this on its own sheet isolates the high-power regenerative path from the signal electronics.

### Peripherals
Everything auxiliary lives here:

- Hall sensor inputs (HALL_A, B, C) for rotor position feedback
- User LED and PROG_INIT for status and boot mode
- SCREF input for configuring the hardware overcurrent threshold
- VBUS and temperature monitoring analog inputs
- Seven spare GPIO pins broken out for future expansion

### Communication
The comm sheet covers all interfaces:

- **SWD** for programming and debug via ST-Link
- **USART1** for traditional serial
- **USB/CAN** on shared pins , the STM32G431 can run either USB CDC VCP or CAN bus on the same physical pins, just not simultaneously

---

## PCB Design

Designed in KiCad 10. High-current PCB design has very specific requirements and this layout took several iterations to get right.

- **6-layer stackup** with dedicated power and ground planes for low-impedance current paths
- **Heavy copper traces**, up to 4mm wide on the bus and phase paths to handle 80-130A
- **Teardrop pads** on all vias and through-holes for better manufacturing yield and mechanical reliability
- **Via stitching** under power stages for thermal and ground plane integrity
- **Netclass-based routing** , separate netclasses for HV, LV, GND, each phase (U/V/W), Signal, and Communication, each with their own clearance and trace width rules

The PCB has been exported in GLB format and can be viewed interactively on the portfolio homepage using the Three.js 3D model viewer.

---

## Key Features

- 15-30V input range
- 80A continuous / 130A peak
- Up to 3kW power delivery
- FOC-ready with per-phase current sensing via integrated op-amps
- Supports 6-Step, SVPWM, and Field Oriented Control via ST Motor Control Workbench
- Hardware overcurrent protection with adjustable SCREF threshold
- Regenerative braking via dedicated brake resistor circuit
- Real-time bus voltage and temperature monitoring
- Hall sensor interface for trapezoidal commutation
- USB CDC VCP for the WebSerial GUI
- CAN bus ready for multi-node networks
- UART for serial debug and external comms
- SWD for full programming and debug
- 7 spare GPIO for custom expansion

---

## Software

The controller works with the full ST Motor Control SDK:

- **Motor Profiler** for automated motor parameter identification
- **MC Workbench** for graphical firmware configuration and code generation
- **STM32CubeIDE** for development with HAL/LL drivers

There is also a custom **WebSerial GUI** built specifically for this controller. It runs entirely in the browser, connects over USB CDC, and gives you a Dashboard, Control, Config, and Terminal tab. No drivers. No app. Just open Chrome and plug in.

---

## Design Decisions

| Decision | Why |
|---|---|
| STSPIN32G4 over discrete design | Massive BOM reduction. Gate driver, buck, op-amps, comparators all in one package. |
| 6-layer PCB | Non-negotiable at these current levels. You need real power and ground planes. |
| Dual USB/CAN pins | Maximizes flexibility without adding transceivers or extra hardware. |
| Hardware SCREF protection | Microsecond-level overcurrent shutdown, completely independent of firmware. |
| Brake resistor on its own sheet | Keeps high-power regenerative path cleanly separated from signal electronics. |

---

## Current Status

- Schematic: Complete (V2)
- PCB layout: Complete
- Fabrication files: Generated and sent to manufacturer
- Firmware: In development via ST Motor Control Workbench
- WebSerial GUI: Functional , all four tabs (Dashboard, Control, Config, Terminal) working

---

## What's Next

- Sensorless FOC using a back-EMF observer for hall-less operation
- CAN-based multi-axis coordination for driving multiple controllers on a bus
- Firmware-level thermal derating based on temperature sensor readings
- Encoder support via spare GPIO for absolute/incremental encoders
- Custom bootloader , USB DFU or CAN-based for field firmware updates

---

## Conclusion

The V2 took everything that was unclear or underpowered in the first version and addressed it properly. Choosing the STSPIN32G4 allowed the design to hit specs that would normally require a much larger board and a more complex BOM.

The hierarchical schematic kept the design manageable. The 6-layer PCB gave it the current handling it needed. And the combination of hardware protections, multiple communication options, and compatibility with ST's motor control ecosystem makes this something you can actually deploy in a real application.

The WebSerial GUI ties it all together , configuration and real-time monitoring from a browser, over USB, with no extra software.

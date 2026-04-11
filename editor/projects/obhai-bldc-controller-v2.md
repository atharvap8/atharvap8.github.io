## Introduction

The **OBhai BLDC Controller V2** is a custom-designed 3-phase Brushless DC motor controller built around the **STSPIN32G4** — a high-integration System-in-Package from STMicroelectronics. This second revision pushes the limits of what a compact motor drive can do, packing serious power handling, rich communication interfaces, and hardware-level protections into a dense, production-ready PCB designed entirely in **KiCad 10**.

This isn't a devkit or evaluation board. It's a purpose-built controller designed from the ground up to drive BLDC and PMSM motors in real-world applications — from electric vehicles to industrial automation.

---

## About the STSPIN32G4

The **STSPIN32G4** is a System-in-Package (SiP) that integrates:

- **STM32G431VBTx** — Arm Cortex-M4 MCU running at 170 MHz, with FPU and DSP instructions
- **3-Phase Gate Driver** — 1A source and sink capability for driving external MOSFETs or IGBTs
- **Integrated Buck Converter** — On-chip step-down regulator for self-powering the MCU and peripherals
- **Op-Amps** — Three internal op-amps for inline current sensing across all phases
- **Comparators** — Hardware-based overcurrent protection with configurable thresholds

All of this in a roughly **10mm × 10mm** QFN package — a remarkable level of integration for a motor drive IC.

---

## Specifications

| Parameter | Min. | Typical | Max. |
|---|---|---|---|
| **Vbus (Input Voltage)** | 15V | 24V | 30V |
| **Ibus (Continuous)** | — | 80A | 100A |
| **Ibus (Peak)** | — | 120A | 130A |
| **Pbus (Power)** | — | 2.4kW | 3kW |

---

## Schematic Architecture

The design is organized into a hierarchical multi-sheet schematic with well-defined functional blocks:

### 1. MCU Core (STSPIN32G4)
The central sheet contains the STSPIN32G4 SiP with all its pin connections mapped to the surrounding sub-sheets. This includes gate drive outputs (GHS/GLS for U, V, W phases), op-amp pins (OPAVin+, OPAVin-, OPAVout for each phase), and all I/O routing.

### 2. Power Supply
A dedicated power sheet handles the input bus voltage conditioning, the internal buck converter external components (BUCK_SW output), VBAT, and VREF+ generation. The power stage is designed to handle the full 15–30V bus range with proper decoupling and filtering.

### 3. Phase Drivers (U, V, W)
Each of the three motor phases has its own schematic sheet containing:
- **External power MOSFETs** driven by the STSPIN32G4's integrated gate drivers
- **Bootstrap capacitors** (CBOOT_U/V/W) for high-side gate driving
- **Current sensing network** — shunt resistors with signals routed to the internal op-amps for real-time phase current measurement
- **Phase output connections** to the motor

### 4. Brake Resistor Circuit
A dedicated braking sheet for regenerative energy dissipation. The R_BRAKE_H and R_BRAKE_L connections route through a power resistor circuit controlled by the MCU for dynamic braking during deceleration.

### 5. Peripherals
This sheet consolidates all the auxiliary I/O:
- **Hall sensor inputs** (HALL_A, HALL_B, HALL_C) for rotor position feedback
- **User LED and PROG_INIT** for status indication and boot mode selection
- **SCREF** — Short-circuit reference voltage for hardware overcurrent protection
- **VBUS monitoring** and **Temperature monitoring** — analog inputs for real-time bus voltage and thermal supervision
- **Multiple spare GPIO** (PA8, PA15, PB6, PB10, PC3, PC13, PC14) broken out for expansion

### 6. Communication
The communication sheet provides a comprehensive set of interfaces:
- **SWD** (SWCLK, SWDIO, SWO) for programming and debug via ST-Link
- **USART1** (TX/RX) for serial communication
- **USB/CAN** — dual-function pins (USB_DM/CAN_RX, USB_DP/CAN_TX) supporting either USB CDC Virtual COM Port or CAN bus communication

---

## PCB Design

The PCB was designed in **KiCad 10** with careful attention to high-current layout practices:

- **6-layer stackup** — dedicated power and ground planes for low-impedance current paths
- **Heavy copper traces** — up to 4mm width on power paths to handle 80–130A
- **Controlled impedance** — signal traces with matched lengths for the communication interfaces
- **Thermal management** — via stitching under power stages, exposed copper pads for heat sinking
- **Teardrop pads** — enabled on all vias and through-holes for improved manufacturing yield
- **Netclass-aware routing** — distinct net classes for HV, LV, GND, Phase (U/V/W), Signal, and Communication nets with appropriate clearances and trace widths

---

## Key Features

- **15–30V input voltage range** — compatible with 6S LiPo batteries and 24V industrial supplies
- **80A continuous / 130A peak** current handling
- **Up to 3kW power delivery**
- **Field Oriented Control (FOC)** capable — hardware-ready with per-phase current sensing via integrated op-amps
- **Multiple motor control algorithms** — supports 6-Step, SVPWM, and FOC via the ST Motor Control Workbench
- **Hardware overcurrent protection** — using the STSPIN32G4's internal comparators with adjustable SCREF threshold
- **Regenerative braking** — dedicated brake resistor circuit for controlled energy dissipation
- **Bus voltage and temperature monitoring** — real-time analog supervision for safe operation
- **Hall sensor support** — 3-channel Hall effect sensor interface for trapezoidal commutation
- **USB CDC VCP** — browser-based configuration and telemetry via WebSerial GUI
- **CAN bus** — ready for multi-node vehicle or industrial networks
- **UART** — traditional serial interface for debugging and external communication
- **SWD debug** — full debug and programming via ST-Link
- **Spare GPIO** — 7 additional I/O pins broken out for custom expansion

---

## Software Ecosystem

The controller is fully supported by the **ST Motor Control Workbench (MCSDK)** ecosystem:

- **Motor Profiler** — automated motor parameter identification
- **MC Workbench** — graphical firmware configuration and code generation
- **STM32CubeIDE** — full development environment with HAL and LL drivers
- **WebSerial GUI** — a custom browser-based interface (also part of this portfolio) for real-time telemetry, parameter tuning, and motor control from any modern browser

---

## Challenges & Design Decisions

| Decision | Rationale |
|---|---|
| STSPIN32G4 over discrete design | Massive BOM reduction; gate driver, buck converter, op-amps, comparators all integrated |
| 6-layer PCB | Essential for proper power/ground planes at these current levels |
| Dual USB/CAN pins | Maximizes communication flexibility without additional transceivers |
| Hardware SCREF protection | Provides microsecond-level overcurrent shutdown independent of firmware |
| Brake resistor on dedicated sheet | Clean separation of high-power regenerative path from signal electronics |

---

## Current Status

- Schematic design: **Complete (V2)**
- PCB layout: **Complete**
- Fabrication files: **Generated and sent for manufacturing**
- Firmware: **In development** — ST Motor Control Workbench project being configured
- WebSerial GUI: **Functional** — Dashboard, Control, Config, and Terminal tabs operational

---

## Future Scope

- **Sensorless FOC** — implement back-EMF observer for hall-less operation
- **CAN-based multi-axis control** — coordinate multiple controllers over CAN bus
- **Thermal derating** — firmware-level current limiting based on temperature monitoring
- **Encoder interface** — add support for incremental/absolute encoders via spare GPIO
- **Custom bootloader** — USB DFU or CAN bootloader for field firmware updates

---

## Conclusion

The OBhai BLDC Controller V2 represents a serious step forward in custom motor drive design. By leveraging the STSPIN32G4's remarkable integration, the design achieves what would traditionally require significantly more board area and component count. From the hierarchical schematic architecture to the high-current PCB layout, every aspect was designed with production-quality standards in mind.

The combination of hardware protections, versatile communication interfaces, and compatibility with ST's proven motor control ecosystem makes this controller a capable platform for real-world BLDC and PMSM motor applications.

---
title: "Controllers and Operations - 1"
date: 2025-01-14T05:34:36+05:30
toc: false
draft: false
---
## Introduction to Microprocessors and Microcontrollers

---

{{< figure src="/img/uCvsuP.png" position=center >}}



| **Feature**             | **Microprocessor**                             | **Microcontroller**                          |
|--------------------------|-----------------------------------------------|---------------------------------------------|
| **Definition**           | General-purpose processor                    | Dedicated to specific tasks                 |
| **Memory**               | External memory required                     | Includes internal RAM, ROM, and I/O ports   |
| **Application**          | Computers, laptops, high-performance devices | Embedded systems (IoT, appliances, etc.)    |
| **Cost**                 | More expensive                               | Cost-effective for specific tasks           |
| **Examples**             | Intel 8086, Pentium, Core i5, i7, AMD Ryzen  | 8051, AVR, PIC, ARM, ESP8266, ESP32, etc.   |

- **Q: Where are these examples present in day-to-day usage?**

{{< figure src="/img/uC-types.jpg" position=right >}}

---

### Applications of Microcontrollers

### Common Applications
- **Consumer Electronics**: TVs, washing machines, microwave ovens
- **Automotive**: Engine control units, airbags, ABS
- **Industrial Automation**: Process controllers, robotics
- **IoT Devices**: Smart home systems, wearables
- **Medical Devices**: ECG machines, glucose monitors

---

### Features of 8051 Microcontroller

- 8-bit microcontroller
- 4 KB ROM (programmable memory)
- 128 bytes RAM
- 32 I/O pins (organized into 4 ports)
- Two 16-bit timers/counters
- Full-duplex UART for serial communication
  Q: What is Full-duplex?
- Interrupt system with 5 sources

---

### Architecture of 8051

{{< figure src="/img/8051-arch.png" position=center >}}

#### **Key Components**
1. **ALU (Arithmetic Logic Unit)**: Performs arithmetic and logical operations.
2. **Registers**: Accumulator (A), B register, general-purpose registers.
3. **Memory**:
   - Program memory (ROM)
   - Data memory (RAM)
4. **I/O Ports**: 4 bidirectional 8-bit ports.
5. **Timers/Counters**: Two 16-bit timers.
6. **Serial Communication**: UART.
7. **Interrupts**: 5 interrupt sources, including external and timer interrupts.

---

### Pin Diagram of 8051

{{< figure src="/img/8051-pd.png" position=center >}}

1. **Port P0 (Pins 32-39)**: Multiplexed as data and address bus.
2. **Port P1 (Pins 1-8)**: General-purpose I/O.
3. **Port P2 (Pins 21-28)**: High-order address bus in external memory interfacing.
4. **Port P3 (Pins 10-17)**: Dual-purpose (I/O + special functions like serial input/output).
5. **Other Pins**:
   - **Vcc (Pin 40)**: +5V supply
   - **GND (Pin 20)**: Ground
   - **RST (Pin 9)**: Reset input
   - **EA (Pin 31)**: External Access enable
   - **ALE (Pin 30)**: Address Latch Enable
   - **PSEN (Pin 29)**: Program Store Enable

---

### Memory Organization of 8051

#### **Internal Memory**
1. **RAM**:
   - 128 bytes divided into:
     - 32 bytes: General-purpose registers (R0 to R7 for 4 banks).
     - 16 bytes: Bit-addressable memory.
     - 80 bytes: General-purpose memory.
   - **SFRs**: Control I/O, timers, and serial communication.
2. **ROM**:
   - 4 KB for program storage.
   - Address range: 0000H - 0FFFH.

#### **External Memory**
- Supports up to 64 KB of program memory and 64 KB of data memory.
- Uses Port 0 and Port 2 for data and address buses.

---

### Interrupt Structure of 8051

#### **Features of 8051 Interrupt System**
- 5 interrupt sources:
  1. **External Interrupt 0 (INT0)**
  2. **Timer 0 Overflow**
  3. **External Interrupt 1 (INT1)**
  4. **Timer 1 Overflow**
  5. **Serial Communication Interrupt**
- **Interrupt Priority Levels**:
  - Low priority
  - High priority (overrides low-priority interrupts)
- **IE (Interrupt Enable) Register**:
  - Enables or disables specific interrupts.
- **IP (Interrupt Priority) Register**:
  - Sets priority levels for interrupts.

#### **Interrupt Execution**
- When an interrupt occurs, the microcontroller:
  1. Suspends the current task.
  2. Jumps to the corresponding Interrupt Service Routine (ISR).
  3. Resumes the main program after ISR execution.

---

### Summary

- **Microprocessor vs Microcontroller**: Microcontrollers are specialized for embedded systems.
- **8051 Features**: 8-bit architecture, 4 KB ROM, 128 bytes RAM, and 32 I/O pins.
- **Applications**: Widely used in IoT, automation, and consumer electronics.
- **8051 Architecture**: Integrated ALU, memory, timers, and serial ports.
- **Pin Diagram and Memory**: Essential for hardware interfacing and program execution.

---

### Questions and Discussion
- 2 doubts from each (minimum)
- In 1 line, tell what did you understood from this presentation.

---

### References:

https://www.tutorialspoint.com/microprocessor/microcontrollers_8051_architecture.htm

https://www.geeksforgeeks.org/whats-difference-between-microcontoller-%C2%B5c-and-microprocessor-%C2%B5p/

https://www.geeksforgeeks.org/microprocessor-tutorials/

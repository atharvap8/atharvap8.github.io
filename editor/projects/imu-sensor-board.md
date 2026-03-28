## Introduction

What happens when you decide to bring a cutting-edge MEMS sensor to life — entirely from scratch? This project is the answer. The **IMU Sensor Board** project chronicles the full journey of designing, fabricating, and validating a custom PCB for the **ISM330DHCX** (ISM6HG256X series) Inertial Measurement Unit by **STMicroelectronics** — from reading datasheets deep into the night, to watching the sensor output clean, stable motion data for the very first time.

This wasn't a kit. There was no pre-made breakout board, no shortcuts. Every step — schematic design, component placement, PCB layout, homemade fabrication, and final soldering — was done by hand. The result: a fully functional IMU sensor board capable of measuring 6-axis motion with integrated machine learning right on-chip.

---

## About the Sensor: ISM330DHCX (ISM6HG256X)

The **ISM330DHCX** is a high-performance, automotive-grade Inertial Measurement Unit (IMU) from STMicroelectronics, part of the **iNEMO inertial module** product family. It's not your average sensor — it is a complete MEMS inertial platform packed into a single tiny package.

### Key Features
- **6-Axis MEMS**: 3-axis accelerometer + 3-axis gyroscope in one package
- **Integrated Machine Learning Core (MLC)**: On-chip AI for gesture recognition and activity detection — no host MCU required for inference
- **Sensor Fusion Accelerator (SFA)**: Processes motion data internally
- **Always-On capability**: Ultra-low power for wearables and IoT
- **Wide measurement ranges**: ±2/±4/±8/±16 g (accel), ±125/±250/±500/±1000/±2000 dps (gyro)
- **Automotive-grade**: AEC-Q100 qualified, designed for harsh environments
- **Digital output**: SPI & I²C interfaces
- **Embedded FIFO**: Up to 3KB buffer for burst data capture

This level of integration makes it suitable for **robotics, drones, wearables, industrial motion sensing**, and advanced automotive applications.

---

## Phase 1: Doomscrolling the Datasheet 📄

Every great hardware project begins with reading documentation — and this one was no different.

Before touching any design software, the datasheet and application notes from STMicroelectronics were thoroughly studied:

- **AN5561** — ISM330DHCX Application Note covering layout guidelines, decoupling strategies, and boot sequences
- **Datasheet DS12425** — Full electrical characteristics, pin configurations, FIFO management, and ML Core programming

Key takeaways from the documentation phase:
- The sensor requires dedicated **decoupling capacitors** (100nF + 10µF) on both VDD and VDDIO rails, placed as close to the IC as possible
- The **VDDIO** pin sets the logic level for digital communication (1.8V or 3.3V compatible)
- The **SDO/SA0** pin configures the I²C address and must be tied to a defined logic level
- **INT1 and INT2** interrupt pins are critical for data-ready signaling and FIFO watermark alerts
- Layout must minimize parasitic inductance on power pins and keep the MEMS package away from mechanical stress points

The documentation study phase was the foundation — "doomscrolling" datasheets, but the productive kind.

---

## Phase 2: Schematic Design

With a thorough understanding of the sensor's requirements, the schematic was drafted using **EasyEDA**.

### Schematic Highlights

The circuit is intentionally minimal — the sensor needs very few external components, which is part of its design elegance:

| Component | Value / Part | Purpose |
|---|---|---|
| ISM330DHCX | STMicro IMU | Main sensor IC |
| C1, C2 | 100nF (0402) | VDD bulk decoupling |
| C3, C4 | 10µF (0805) | VDD low-frequency bypass |
| C5, C6 | 100nF (0402) | VDDIO decoupling |
| R1 | 4.7kΩ | I²C SDA pull-up |
| R2 | 4.7kΩ | I²C SCL pull-up |
| R3 | 10kΩ | SDO address select |
| J1 | 6-pin header | SPI/I²C breakout connector |

### Design Decisions
- **I²C mode selected** for simplicity — SDO pin pulled low for address 0x6A
- **Both interrupt lines broken out** (INT1, INT2) for future firmware use
- **Ferrite bead** on VDD_IO line to reduce digital noise coupling into the sensitive MEMS element
- Header pinout made compatible with Dupont jumper wires for easy prototyping connection

---

## Phase 3: PCB Layout

The PCB layout was the most technically demanding design phase. The ISM330DHCX comes in a **LGA-14L** package with 0.5mm pin pitch — extremely fine for a homemade PCB.

### Layout Strategy

```
┌────────────────────────────────────────┐
│  C1   C2   [FERRITE]   C3   C4         │
│  ↓    ↓        ↓       ↓    ↓          │
│ ┌────────────────────────────────────┐ │
│ │        ISM330DHCX                  │ │
│ │         LGA-14L                    │ │
│ │   14 pads @ 0.5mm pitch            │ │
│ └────────────────────────────────────┘ │
│     ↓              ↓                   │
│   INT1            INT2                 │
│            ↓                           │
│         J1 (Breakout Header)           │
└────────────────────────────────────────┘
```

### Critical Layout Rules Applied
1. **Decoupling caps within 0.5mm of power pins** — traces run under the component on the inner copper area
2. **Star-ground topology** — all ground returns meet at a single pour underneath the IC
3. **No mechanical stress paths** — mounting holes placed away from the MEMS sensor to prevent board flex interference
4. **Separate analog and digital ground polygons** — connected at a single point near the IC
5. **Via stitching** on ground plane for thermal and EMI performance
6. **SPI/I²C traces kept short and matched length** to minimize signal skew

The 3D render of the final PCB gave a first look at how the board would appear once fabricated — compact, clean, and precisely laid out.

---

## Phase 4: DIY Fabrication — The Toner Transfer Method

This is where theory met reality, and sleeves had to be rolled up. Since sending the board to a PCB house wasn't the path taken, **homemade fabrication using the Toner Transfer Method** was chosen. This is arguably the most challenging and rewarding part of the entire project.

### Why Toner Transfer?
- Accessible: Only requires a laser printer, copper clad board, and an iron
- Fast: Results in hours, not days
- Educational: Forces you to understand the PCB manufacturing process at a fundamental level

### The Process — Step by Step

#### Step 1: Print on Photo Paper
The PCB layout (bottom copper layer mirrored) was printed at 1:1 scale on **glossy photo paper** using a laser printer with the highest quality and "darkest" toner settings. Photo paper is used because the toner bonds to the glossy surface without being absorbed by the paper fibers — making transfer much cleaner.

> **Tip**: Always print a test dummy copy and measure trace widths with calipers before committing to the transfer step.

#### Step 2: Prepare the Copper Clad Board
The FR4 single-sided copper clad board was cut to size using a rotary tool. The copper surface was cleaned using:
- **Fine steel wool** (400 grit) to remove oxidation
- **Isopropyl alcohol (IPA)** wipe to remove oils and residues

A clean, shiny copper surface is critical. Any oxidation or oil will cause toner not to adhere properly.

#### Step 3: Iron the Toner — The Critical Step ⚠️
The printed paper was placed face-down on the copper board and ironed at approximately **160°C–180°C** (cotton/linen setting on most irons) for about **8–10 minutes** with firm, even pressure.

> This is **the most crucial step in the entire process** and directly determines success or failure. Too cold — toner won't transfer. Too hot — toner bleeds and traces merge. Uneven pressure — incomplete transfer on some pads.

The technique used:
- Apply consistent firm pressure — never slide the iron, use a press-and-lift motion
- Pay extra attention to edges and corners where pressure naturally decreases
- Reheat multiple times from different angles to ensure full coverage

#### Step 4: Soak and Peel
With the board still hot, it was submerged in warm water for 3–5 minutes. The paper softened and was carefully peeled away — slowly, from one corner, at a low angle. Any stubborn paper fibers were gently rubbed off with a soft cloth under water.

What remained: toner traces directly bonded to the copper surface — the resist pattern that would protect copper during etching.

#### Step 5: Touch-Up with a Permanent Marker
Under bright light, every trace was inspected for continuity. Any breaks or thin spots were touched up with a **fine-tip permanent marker** (Sharpie Black) which acts as an additional etch resist.

#### Step 6: Etching — Chemical Copper Removal
The board was submerged in a **Ferric Chloride (FeCl₃)** etching solution at approximately 40°C (warm, speeds the reaction). The board was agitated continuously to move fresh etchant over the surface.

The etching process:
- Time: ~20–35 minutes (depending on solution freshness and copper thickness)
- Monitoring: The board was checked every 5 minutes
- Completion: When all unprotected copper was fully dissolved and only the toner-covered traces remained

> **Safety Note**: FeCl₃ is corrosive and will permanently stain everything it contacts. Work in a well-ventilated area, wear gloves and eye protection, and dispose of spent etchant per local regulations.

#### Step 7: Toner Removal and Inspection
The toner mask was removed using acetone or IPA, revealing bright copper traces underneath. The board was inspected under a magnifying glass / loupe for:
- **Bridged traces** (solder bridges risk)
- **Open traces** (breaks in connectivity)
- **Pad size accuracy** (critical for LGA soldering)

#### Step 8: Drilling
Holes for the header connector were drilled using a **0.8mm drill bit** in a mini PCB drill press. Burrs were cleaned with sandpaper.

---

## Phase 5: Soldering the ISM330DHCX

This was the most nerve-wracking step. The ISM330DHCX in an LGA-14L package has **no exposed leads** — all pads are underneath the component body, 0.5mm apart. Traditional hand soldering is nearly impossible.

### Technique Used: Solder Paste + Hot Air Rework
1. **Solder paste** (Sn63/Pb37, 4 oz, Type 4) was applied to each pad using a toothpick / fine needle
2. The sensor was placed using **tweezers** under a phone magnification app, aligned carefully to the pad pattern
3. A **hot air rework station** at 320°C with a focused nozzle was used to reflow the solder
4. The board was allowed to cool completely before any inspection

### Verification
Continuity was verified with a **multimeter in diode/continuity mode** between each pin and its traced net. All 14 connections verified good.

---

## Phase 6: Firmware and Testing

With the hardware ready, the sensor was wired to an **ESP32 development board** via I²C:

```
ISM330DHCX Board → ESP32
──────────────────────────
VDD              → 3.3V
GND              → GND
SDA              → GPIO21
SCL              → GPIO22
INT1             → GPIO34 (optional)
```

### Basic Arduino Test Code

```cpp
#include <Wire.h>

#define ISM330_ADDR 0x6A
#define WHO_AM_I_REG 0x0F
#define CTRL1_XL     0x10  // Accelerometer control
#define CTRL2_G      0x11  // Gyroscope control
#define OUTX_L_G     0x22  // Gyro X output (low byte)
#define OUTX_L_A     0x28  // Accel X output (low byte)

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  // Verify sensor ID
  Wire.beginTransmission(ISM330_ADDR);
  Wire.write(WHO_AM_I_REG);
  Wire.endTransmission(false);
  Wire.requestFrom(ISM330_ADDR, 1);
  uint8_t id = Wire.read();
  
  Serial.print("WHO_AM_I: 0x");
  Serial.println(id, HEX);  // Expected: 0x6B

  // Configure accelerometer: 104Hz ODR, ±4g
  Wire.beginTransmission(ISM330_ADDR);
  Wire.write(CTRL1_XL);
  Wire.write(0x42);  // ODR=104Hz, FS=±4g
  Wire.endTransmission();

  // Configure gyroscope: 104Hz ODR, ±1000dps
  Wire.beginTransmission(ISM330_ADDR);
  Wire.write(CTRL2_G);
  Wire.write(0x44);  // ODR=104Hz, FS=±1000dps
  Wire.endTransmission();
}

void loop() {
  uint8_t buf[12];
  
  // Read gyro + accel (6 bytes each)
  Wire.beginTransmission(ISM330_ADDR);
  Wire.write(OUTX_L_G);
  Wire.endTransmission(false);
  Wire.requestFrom(ISM330_ADDR, 12);
  for (int i = 0; i < 12; i++) buf[i] = Wire.read();

  int16_t gx = (buf[1]<<8)|buf[0];
  int16_t gy = (buf[3]<<8)|buf[2];
  int16_t gz = (buf[5]<<8)|buf[4];
  int16_t ax = (buf[7]<<8)|buf[6];
  int16_t ay = (buf[9]<<8)|buf[8];
  int16_t az = (buf[11]<<8)|buf[10];

  // Convert to physical units
  float gx_dps = gx * 35.0 / 1000.0;  // ±1000dps sensitivity: 35 mdps/LSB
  float ax_g   = ax * 0.122 / 1000.0; // ±4g sensitivity: 0.122 mg/LSB

  Serial.printf("Gyro: %.2f, %.2f, %.2f dps | Accel: %.3f, %.3f, %.3f g\n",
    gx_dps, gy * 35.0/1000.0, gz * 35.0/1000.0,
    ax_g, ay * 0.122/1000.0, az * 0.122/1000.0);

  delay(100);
}
```

### Test Results
The sensor responded immediately on first power-up. The WHO_AM_I register returned **0x6B** — correct and confirming proper electrical connection. Motion data was clean with minimal noise, and the output was stable when the board was stationary. Tilting the board produced expected changes in all three accelerometer axes, and rotation produced clear gyroscope readings.

**Seeing the sensor respond accurately to motion, outputting clean and stable data — that was the moment that made the entire challenging process completely worthwhile.**

---

## Challenges & Lessons Learned

| Challenge | Root Cause | Solution |
|---|---|---|
| Incomplete toner transfer on fine traces | Uneven iron pressure | Multiple iron passes at different angles |
| Etched gaps in 0.5mm traces | Over-etching due to FeCl₃ saturation | Monitor closely, use fresh solution |
| LGA package alignment | No visible pins for reference | Phone camera magnification + fiducial marks |
| Via drilling accuracy | Manual marking error | Center-punch before drilling |
| SDA/SCL signal noise | Long flying leads | Short, twisted pair wires to ESP32 |

---

## Advantages of a Custom IMU Board

- **Exactly the footprint you need** — no wasted space from generic breakout boards
- **Proper decoupling** — designed per application note, not generic 0.1µF caps
- **Access to all pins** — including both INT lines and SDO, often missing on commercial breakouts
- **Learning depth** — understanding the sensor at the hardware level deeply informs software development
- **Cost** — DIY board cost is a fraction of commercial breakouts for this sensor tier

---

## Future Scope

- **SPI mode testing** — switch from I²C to SPI for higher data-rate applications (up to 10MHz)
- **Machine Learning Core programming** — use ST's MEMS Studio to train and deploy gesture recognition models directly on the chip
- **Integration with AHRS**: Implement Madgwick or Mahony filter for full attitude (roll/pitch/yaw) estimation
- **Wireless telemetry**: Pair with an ESP32 for Bluetooth Low Energy streaming of IMU data to a phone app
- **Professional PCB fabrication**: Send the verified design to a PCB house (JLCPCB/PCBWay) for cleaner, ENIG-finished boards
- **Sensor Fusion**: Combine with a magnetometer (e.g., LIS3MDL) for 9-DOF orientation

---

## Conclusion

This IMU Sensor Board project was a comprehensive exercise in every facet of embedded hardware engineering — from digesting a complex technical datasheet, through careful schematic and PCB design, to the demanding and messy reality of DIY PCB fabrication. The toner transfer method, while unforgiving, produced a functional board capable of driving a world-class MEMS sensor.

The ISM330DHCX's integrated Machine Learning Core opens up a world of on-chip intelligence that most designers never fully exploit. Having a custom, purpose-built board to experiment with it — built entirely by hand — makes this project a uniquely educational and satisfying achievement.

*"One hell of a process to accomplish, but seeing the sensor respond accurately to motion, and output clean & stable data, made the entire effort worthwhile."*

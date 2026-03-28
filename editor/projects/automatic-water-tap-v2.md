## Introduction

Restroom hygiene is one of those problems hiding in plain sight. Every time you touch a tap to wash your hands, you're potentially re-contaminating hands you were about to clean — a problem that has existed since shared water taps were invented. This project solves exactly that.

The **Automatic Water Tap V2** is a DIY, touchless water tap controller built around infrared sensing. It detects when your hands enter the sensing zone and automatically activates a solenoid valve to release water — no touch required. The moment you pull your hands away, the water stops. It's hygienic, water-efficient, and surprisingly simple to build from off-the-shelf components.

This is Version 2 of the design — a cleaner, more refined revision with improved IR sensor alignment, better enclosure design, and a more robust switching circuit using a dedicated MOSFET control module.

---

## The Problem with Standard Taps

Traditional manual water taps:
- **Spread germs**: Touching with dirty hands contaminates the handle for the next user
- **Waste water**: People often leave taps running while lathering soap
- **Wear out**: Mechanical valve seats erode from repeated manual operation

Commercial automatic taps exist but cost ₹3,000–₹10,000+. This project achieves the same core functionality for a fraction of the cost.

---

## How It Works

The system operates on a straightforward principle:

```
Hand enters → IR beam reflects → Signal detected → MOSFET switches ON → Solenoid opens → Water flows
Hand leaves → IR beam NOT reflected → MOSFET switches OFF → Solenoid closes → Water stops
```

### The IR Detection Loop

The **IR Sensor Module** continuously transmits an infrared beam from its LED emitter. When a reflective surface (your hand) enters the detection zone — typically 5–15cm depending on calibration — the beam bounces back to the photodiode receiver. The sensor's comparator circuit triggers its digital output LOW (active low signal), signaling object detection.

### The Switching Circuit

A **D4184 MOSFET control module** receives the sensor's output signal. This module contains an N-channel MOSFET driven by a gate resistor network that provides proper logic-level drive from the IR sensor's output. When triggered:

- Gate voltage rises → MOSFET switches ON → Current flows through solenoid coil
- The **12V solenoid valve** energizes, its plunger retracts, and the water path opens
- A **1N4007 flyback diode** across the solenoid coil catches the inductive kickback voltage spike when the MOSFET turns off — this is critical to protect the MOSFET from voltage spikes that can exceed 100V

### Power Architecture

```
230V AC Mains
      ↓
[12V DC SMPS Power Brick]
      ↓
[Mini 360 Buck Converter] → 5V DC (powers IR sensor module + logic)
      ↓
[MOSFET Module]
      ↓
[12V Solenoid Valve]
```

The **Mini 360 Buck Converter** steps down the 12V supply from the power brick to a regulated 5V for powering the IR sensor module. This avoids needing a separate 5V power supply.

---

## Components Required

| Component | Specification | Notes |
|---|---|---|
| IR Sensor Module | Active LOW output, adjustable sensitivity | FC-51 or LM393-based |
| 12V Solenoid Valve | Normally Closed (NC), 1/2" or 3/4" BSP | Must be NC type for safety |
| D4184 MOSFET Control Module | N-Channel, 40V/50A | Pre-built module with gate driver |
| 1N4007 Diode | General Purpose Rectifier, 1A/1000V | Flyback protection |
| Mini 360 Buck Converter | Input: 4.5–24V, Output: 1–17V | Set output to 5V before use |
| BD140 PNP Transistor | 80V, 1.5A | Optional — for signal inversion |
| 10kΩ Resistor | 1/4W, ±5% | Pull-up / biasing |
| 230V AC to 12V DC Adapter | 1–2A rated | Standard wall adapter |
| Enclosure (ABS Plastic) | Appropriate size | For housing electronics |
| Insulation Tape | Standard | Safety and strain relief |
| Double-Sided Tape | Strong adhesive | For sensor mounting under tap |
| Zip Ties & Screws | Standard hardware | Cable management |
| Water Tap + Piping | — | The tap to automate |

---

## Circuit Design

### Wiring Overview

```
   [230V AC]──[12V Adapter]
                    │
                    ├──[GND]───────────────────────────────────────────────────┐
                    │                                                           │
                    ├──[12V]──[Mini360 Buck (set to 5V)]──[5V]──[IR Sensor VCC]│
                    │                       GND ────────────────[IR Sensor GND]│
                    │                                                           │
                    │         [IR Sensor OUT] ──────[D4184 Input]              │
                    │                                       │                  │
                    └──[12V]────────────────────[D4184 VCC/Drain side]         │
                                                            │                  │
                                                    [Solenoid Valve]           │
                                                            │                  │
                                     [1N4007 across solenoid, cathode to 12V]  │
                                                            │                  │
                                                           [GND]───────────────┘
```

### Important Wiring Notes
- The solenoid is a purely inductive load — **always fit the flyback diode** in parallel with the solenoid coil (cathode to positive, anode to negative terminal)
- **Set the Mini 360 buck output to 5V** before connecting to the IR sensor — measure with a multimeter first
- Use **heat shrink tubing** over all solder joints, especially on AC-side connections
- **Ground all modules together** — a floating ground between the IR sensor and MOSFET module will cause erratic behavior

---

## Step-by-Step Build Guide

### Step 1: Configure the Buck Converter
1. Connect the Mini 360 buck converter to the 12V adapter (no other load connected yet)
2. Using a multimeter, measure the output terminals
3. Adjust the onboard trimmer potentiometer until output reads **5.0V ± 0.1V**
4. Disconnect from power

### Step 2: Prepare the Enclosure
1. Mark and drill **two M4 holes** for wall mounting
2. Drill a cable entry hole for the 12V adapter wire
3. Drill a cable exit hole for the solenoid valve wires
4. Drill a separate hole or slot for the IR sensor wiring to run to the tap location

### Step 3: Assemble the Circuit
1. Solder the 10kΩ pull-up resistor between the IR sensor output and 5V (if not already on-module)
2. Solder the 1N4007 diode across the solenoid valve terminals (observe polarity — cathode stripe on the + terminal)
3. Make all wire connections per the wiring diagram
4. **Insulate every solder joint with heat shrink** before closing the enclosure

### Step 4: Mount Components Inside Enclosure
1. Use screw/standoff mounts or thick double-sided tape to secure the buck converter, MOSFET module inside the enclosure
2. Run cables neatly using zip ties — keep 230V/12V AC wiring away from signal wires
3. Fit the power adapter cable through the grommet/hole, and strain-relief it with a zip tie inside

### Step 5: Install the Solenoid Valve
1. Thread the solenoid valve inline with the tap's water supply pipe
2. **Check the flow direction arrow** on the solenoid body — install in the correct direction (inlet to outlet)
3. If installed backwards:
   - NC valve will flow water continuously regardless of electrical state, OR
   - The valve will not open even when energized
4. Use PTFE tape on all threaded fittings and check for leaks before powering up

### Step 6: Mount the IR Sensor Under the Tap
1. Cut a strip of electrical insulation tape to match the back of the IR sensor PCB — apply it to the PCB back to prevent short circuits
2. Apply strong double-sided tape on top of the insulation tape
3. Mount the sensor **directly underneath the tap spout**, angling the sensor LEDs horizontally outward to create a U-shaped detection zone in front of the spout
4. Wrap insulation tape around the sensor and the tap body to secure it firmly — the sensor must not shift or the calibration will drift

### Step 7: Route and Connect All Wires
1. Run the sensor signal wire back to the MOSFET module in the enclosure
2. Run the solenoid wires from the valve location back to the enclosure
3. Ensure no tension on any joints — use zip ties for strain relief at every exit point

### Step 8: First Power-Up
1. Double-check all connections and polarity one more time
2. Switch on the 12V adapter
3. The solenoid should remain **closed** (no water flowing) with no hand in front of the sensor

### Step 9: Calibrate the IR Sensor
1. Place your hand at your desired trigger distance (typical: 8–12cm from the tap)
2. Adjust the IR sensor's **sensitivity trimmer potentiometer** (small blue pot on the module) until the LED on the module just barely lights up at that distance
3. Move your hand away — the LED should turn off. Move it back in — LED should turn on again
4. Test at different ambient light conditions — direct sunlight can saturate the IR photodiode and desensitize the sensor. Aim the sensor slightly downward away from direct light if this is an issue.

### Step 10: Test and Verify
1. Place a bowl or bucket below the tap to catch water during testing
2. Wave your hand in front of the sensor — water should flow immediately
3. Remove your hand — water should stop within 0.5 seconds
4. Check for solenoid valve leaks around fittings
5. Verify no condensation issues inside the electronics enclosure if the installation is in a humid bathroom environment

---

## Calibration Tips

- **False triggers (water runs by itself)**: The sensor is too sensitive. Rotate the trimmer slowly to reduce sensitivity.
- **No detection (hand must be very close)**: Rotate trimmer to increase sensitivity, or check if sensor LEDs are aligned correctly.
- **Erratic behavior**: Check ground connections — all modules must share a common ground.
- **Morning/evening false triggers**: Sunlight angle changes can affect detection. Add a small cardboard shield around the sensor if this is a recurring issue.

---

## Advantages

- **Touch-free operation** — eliminates a primary germ transmission vector in shared restrooms
- **Water conservation** — water only flows when hands are present, preventing "tap left running" scenarios
- **Low cost** — complete build under ₹500 compared to ₹3,000+ commercial units
- **Silent solenoid valve** — 12V valves operate almost silently compared to higher voltage alternatives
- **No microcontroller needed** — entirely analog/discrete logic; no programming required
- **Easy installation** — mounts onto any existing tap without plumbing replacement

---

## Disadvantages

- **Dependent on 230V power** — cannot work during power outages (no water access)
- **Detection zone sensitivity** — bright, direct ambient IR (sunlight) can affect accuracy
- **Solenoid valve pressure rating** — must be matched to your water supply pressure
- **Not suitable for very cold climates** without weatherproofing — solenoid valve rubber seals can stiffen

---

## Future Improvements

- **Add a manual override switch** wired in parallel with the solenoid, allowing water to flow even if the sensor fails
- **Timer circuit** (NE555 monostable) to limit maximum water flow duration per trigger — prevents solenoid staying open if something is left in front of the sensor
- **Battery backup** using a 12V SLA battery with automatic switchover — maintains functionality during power outages
- **Dual-zone detection** — separate "approach" and "retreat" zones for more reliable triggering in high-traffic scenarios
- **Custom PCB** consolidating the IR sensor, buck converter, gate drive and flyback protection into a single clean board

---

## Conclusion

The Automatic Water Tap V2 is a genuinely useful project that solves a real-world hygiene and water conservation problem with simple, reliable electronics. It doesn't need a microcontroller, Wi-Fi, or a mobile app — just clean analog sensing and a robust switching circuit. The result is a touchless tap experience indistinguishable from commercial units, built for a fraction of the cost.

Building it teaches a surprisingly broad set of skills: inductive load switching, power supply architecture, sensor calibration, plumbing basics, and thoughtful enclosure design. It's the kind of project that earns its place on the wall — not just as a demonstration, but as something that genuinely gets used every day.

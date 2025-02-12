---
title: "Basics of Electrical & Electronics - Unit 1 & 2"
date: 2025-02-12T05:34:36+05:30
toc: false
draft: false
---

# **Basics of Electrical and Electronics**  
## **Unit 1 & Unit 2 Presentation**  

---

## **Unit 1: Elementary Concepts**

### **1. Concept of Potential Difference, Current, and Resistance**  
- **Potential Difference (Voltage, V)**: Difference in electric potential between two points. Measured in **Volts (V)**.  
- **Current (I)**: Flow of electric charge. Measured in **Amperes (A)**.  
- **Resistance (R)**: Opposition to current flow. Measured in **Ohms (Ω)**.  
- Power factor is given by $ \cos\theta $.


---

### **2. Ohm’s Law**  
- **Formula**:  
  \[
  V = I \times R
  \]
- Voltage is directly proportional to current when resistance is constant.  

---

### **3. Series and Parallel Circuits**  

#### **Series Circuit**  
- Single path for current.  
- **Total Resistance**:  
  \[
  R_t = R_1 + R_2 + R_3 + ... + R_n
  \]
- **Current remains same** in all components.  
- **Voltage divides across components**.  

#### **Parallel Circuit**  
- Multiple paths for current.  
- **Total Resistance**:  
  \[
  \frac{1}{R_t} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + ... + \frac{1}{R_n}
  \]
- **Voltage remains same** across components.  
- **Current divides** among branches.  

---

### **4. Voltage and Current Dividers**  

- **Voltage Divider Rule**:  
  \[
  V_x = V_{total} \times \frac{R_x}{R_{total}}
  \]
- **Current Divider Rule**:  
  \[
  I_x = I_{total} \times \frac{R_{total}}{R_x}
  \]

---

### **5. Power and Energy Calculations**  
- **Power (P)**: Rate of energy transfer. Measured in **Watts (W)**.  
  \[
  P = V \times I
  \]
- **Energy (E)**: Total power used over time. Measured in **Joules (J)**.  
  \[
  E = P \times t
  \]
- **Electricity Bill Calculation**:  
  - Energy is measured in **Kilowatt-hours (kWh)**.  
  - **Cost = Units Consumed × Rate per kWh**.  

---

### **6. Kirchhoff’s Laws**  

#### **Kirchhoff’s Current Law (KCL)**  
- **Sum of currents entering a junction = Sum of currents leaving the junction**.  
  \[
  \sum I_{in} = \sum I_{out}
  \]

#### **Kirchhoff’s Voltage Law (KVL)**  
- **Sum of all voltages in a closed loop = 0**.  
  \[
  \sum V = 0
  \]

---

### **7. SI Units of Work, Power, and Energy**  

| Quantity  | Symbol | Unit Name  | Unit Symbol |
|-----------|--------|------------|-------------|
| Work      | W      | Joule      | J           |
| Power     | P      | Watt       | W           |
| Energy    | E      | Joule      | J           |
| Voltage   | V      | Volt       | V           |
| Current   | I      | Ampere     | A           |
| Resistance| R      | Ohm        | Ω           |

---

## **Unit 2: Single Phase and Polyphase A.C. Circuits**  

### **1. Generation of Single Phase Sinusoidal A.C. Voltages**  
- **Alternating Current (AC)**: Current that varies sinusoidally over time.  
- **Generated using rotating coils in a magnetic field**.  
- **AC Voltage Equation**:  
  \[
  v(t) = V_m \sin(\omega t)
  \]
  where:  
  - \( V_m \) = Peak Voltage  
  - \( \omega \) = Angular Frequency  
  - \( t \) = Time  

---

### **2. AC Quantities and Phasor Representation**  
- **Phasor**: Represents AC quantities as rotating vectors in a complex plane.  
- **Amplitude (Magnitude)**: Peak value of voltage or current.  
- **Phase Angle**: Difference in phase between voltage and current.  

---

### **3. Pure R, Pure L, and Pure C Circuits**  

#### **Pure Resistive Circuit**  
- **Voltage and Current are in phase**.  
- **Power = \( P = V \times I \)**.  

#### **Pure Inductive Circuit**  
- **Current lags voltage by 90°**.  
- **Power = \( P = 0 \) (purely reactive)**.  

#### **Pure Capacitive Circuit**  
- **Current leads voltage by 90°**.  
- **Power = \( P = 0 \) (purely reactive)**.  

---

### **4. Impedance and Admittance**  

- **Impedance (Z)**: Total opposition in an AC circuit. Measured in **Ohms (Ω)**.  
  \[
  Z = R + jX
  \]
  where \( X \) is reactance.  

- **Admittance (Y)**: Reciprocal of impedance. Measured in **Siemens (S)**.  
  \[
  Y = \frac{1}{Z}
  \]

---

### **5. Active, Reactive, Apparent Power and Power Factor**  

- **Active Power (P)**:  
  \[
  P = V \times I \times \cos \phi
  \]  
- **Reactive Power (Q)**:  
  \[
  Q = V \times I \times \sin \phi
  \]  
- **Apparent Power (S)**:  
  \[
  S = V \times I
  \]  
- **Power Factor (PF)**:  
  \[
  PF = \cos \phi
  \]  
  - **PF close to 1** → Efficient system.  
  - **PF close to 0** → High reactive power, inefficient system.  

---

### **6. Polyphase A.C. Circuits**  

#### **Introduction to Three-Phase Supply**  
- Three-phase systems are used for **efficient power transmission**.  
- **More power with less conductor material compared to single-phase**.  

#### **Balanced Three-Phase System**  
- **Equal phase voltages** and **120° phase difference**.  

#### **Relation between Line and Phase Quantities**  

- **For Star Connection**:  
  \[
  V_{L} = \sqrt{3} V_{ph}, \quad I_L = I_{ph}
  \]  

- **For Delta Connection**:  
  \[
  V_L = V_{ph}, \quad I_L = \sqrt{3} I_{ph}
  \]  

---

### **7. Power in Three-Phase Circuits**  

#### **Star Connection**  
\[
P = \sqrt{3} V_L I_L \cos \phi
\]

#### **Delta Connection**  
\[
P = \sqrt{3} V_L I_L \cos \phi
\]

- **Power is same for both Star and Delta connections**.  

---

## **Simulations & Verifications**  
- **Verify Power Factor for RL and RC Circuit using Multisim**.  
- **Verify Line and Phase Values for Star & Delta Connection using Simulation**.  

---

### **End of Presentation**

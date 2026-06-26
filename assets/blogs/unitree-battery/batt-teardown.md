
# Reverse Engineering the Unitree Go2 Battery (BT02-6)

## Overview

Alright, so this is a writeup of a full teardown and reverse engineering pass on the Unitree branded Go2 battery pack, model **BT02-6**.



The goal was simple. We wanted to understand how the pack talks, what it is hiding, and whether we could get it to output power without the rest of the robot present.

Spoiler. We could. It took a microscope, a lot of probing, some packet decoding, and one very smug 10k resistor.

Everything below is documented with photos. Teardown shots, scope captures, board markings, the works. Where you see an image placeholder, that is the real thing from the bench.

> A small note before we start. These packs are lithium based. They store a serious amount of energy. If you poke the wrong thing you get fire, not knowledge. And that fire is not CONTROLLABLE. it will take EVERYTHING with it. We knew the risks. Do not copy this blind.


## Little Theory + Roast Time

Let us get the theory out of the way.

A battery pack is not magic. It is a stack of angry chemistry in a box, plus a babysitter. The cells store the energy. The BMS (the babysitter) decides whether you are allowed to have any.

The cells genuinely do not care about firmware. They will happily dump current into a short circuit at three in the morning. The whole point of the BMS is to stand between you and that decision.

So when a manufacturer wants to lock you out of their pack, they do not lock the cells. They lock the babysitter.

Now here is where we get to roast Unitree a little.

Their older packs had what I will generously call "authentication." The pack would basically sit there waiting to hear a magic word. You send the secret handshake, and the babysitter goes "ah yes, a friend," and turns the output on.

That is not encryption. That is a password on a sticky note. It is a bouncer who lets you in if you whisper the name of the club back to him.

To their credit, the BT02-6 is a step up. The markings are gone, the protocol is quieter, and there is some genuinely clever isolation in there. So we had to actually work for it this time. Slightly annoying. But it was mostly fun.

Let's get ahead & open it.

## The teardown begins

### Opening it up

First pleasant surprise. No glue.

I had braced for the usual nightmare of ultrasonic welded plastic and adhesive that fights you for an hour. Instead the BT02-6 is held together by **four screws**. That's ALL.

Pull the four, lift the shell, and the internal pack lifts straight out. Fully serviceable. No prying, no heat gun, no broken clips. CHEERS!

![Four screws on the underside of the BT02-6 shell](../../assets/blogs/unitree-battery/bottom_mount.jpg)
*Four screws. No glue. Whoever signed off on this, thank you.*

## Pulling the pack

With the shell off, the cell stack and the BMS board come out as one clean module.

You can see the cell group, the balance leads, and the controller board mounted on top. Everything is accessible. Everything is probeable.

This is the dream for reverse engineering. A board you can actually get your probes onto without destroying it first. Many battery packs are sealed with silicone, potting compound, epoxy and what not. And they quote it as a waterproof safety measure, and surprisingly its not the reason. It's because, they don't want their packs opened, and designs to be replicated by anyone.

![Internal pack removed from shell, BMS board visible on top](../../assets/blogs/unitree-battery/pack_pulled_out.jpg)
*The full internal module. Cells below, brains on top, all in the open.*

### The mystery of the sanded ICs

At first we removed the mainboard, and flipped it over. We were expecting a ton of reasearch and 1000+ chrome tabs with different different datasheets, but alas, it wasn't the case, SADLY.


Every meaningful IC has had its markings **laser engraved off**. Not scratched. Not sanded by hand. Properly ablated at the factory so you cannot read part numbers.

This is the classic move. If you cannot read the chip, you cannot pull the datasheet, and you cannot just clone the design.

It is a speed bump, not a wall. But it does mean you stop reading and start reverse engineering by behavior instead. You probe what the chip does, not what it says it is.

![Controller ICs with laser ablated top markings](../../assets/blogs/unitree-battery/chips_no_markings.jpg)
*Markings gone. The chips refused to introduce themselves, so we had to get to know them the hard way.*

## Probing 

So out came the microscope.

We started by examining the traces. Marked up their paths, noted the power stage rails, topology diagram and what not.
For 1-2 components, we were able to find out their numbers, and thus corresponding datasheets.

We spent a long stretch here. Probing, beeping out continuity, photographing the board at high magnification, and slowly mapping which pin went where.

![Board under microscope, probes on the data lines](../../assets/blogs/unitree-battery/probing_board.jpg)
*Microscope, fine probes, and patience.*

### Finding RS485 (and which line is which)

After poking around, we found that 2 of the wire pairs came directly from the connector, to a nearby IC on the PCB. 
After indentifying the pin map, it turned out to be classic RS485 chip pinout.

pin 5 GND
pin 6 A
pin 7 B
pin 8 Vcc

you get similar pinout on MAX485, SN65HVDxx etc. ICs.

but to confirm, we took a look at the GO2 bot teardown video by iFixit. 
at 21:53 time, they showed the mainboard, and we can spot the battery sub board wires coming to main board. 

The connector is clearly labeled B_485. 

Also, 2 POWER + 2 Data wires confirmed, that there is no other way of handshake or activation method was happening/needed between the battery(although could happen thru RS485 but whatever)

Watch here: https://youtu.be/YjVbW6Fc11Y?si=EPMCU-knJwPahh8X&t=1313

That is the good news. RS485 is a differential pair. Two lines, A and B. The bad news is that nothing on the board tells you which is which, and the markings that might have helped are, of course, gone.

We sorted polarity the practical way. We listened.

The pack talks one direction quite happily on power up. We built a simple module with a microcontroller + max485 uart to RS485 converter. and the code was basically to snifff incoming data bytes at baud of 115200 bps.
and BOOM! 

garbage came thru
yeah
end of the story hehe

HAHA NO, it was due to A and B lines, connected in reverse.
we tried flipping them, and this time, COMRADES, we got the DATA!


And there it was, every frame started with the identical **FE FF** header that Unitree loves to use. The moment you see FE FF on a Unitree bus, you know you are in the right place.

![RS485 frames starting with FE FF](../../assets/blogs/unitree-battery/frame_start.png)
*FE FF, right on cue. The Unitree calling card.*

### Decoding the packets

Once we had clean frames, we had to figure out the structure.

Header, then payload, then presumably a checksum at the tail. The usual shape. But the field layout was not obvious by eye.

This is where a bit of help sped things up. I dumped a pile of captured frames into Claude, described what we were seeing, and worked through the packet structure interactively. Header bytes, length field, the data region, and the trailing check.

Once the layout clicked, the reported values lined up with reality. Pack voltage, current, the per group readings. All of it parses cleanly now.

![decoded structure](../../assets/blogs/unitree-battery/decoded_structure.jpg)
*The decoded frame layout. FE FF header, payload, checksum. Everything in its place.*

### The suspicious optocoupler

Here is where it got interesting.

While probing the enable side of the board, we found a component that smelled like an **optocoupler**. Something that was clearly expecting an input state change, not a data command.

In other words, the pack was not waiting only for a magic word over the bus. It was watching a physical line for a transition.

Right next to it sat an **isolation transformer** and a small cluster of support ICs. We mapped that whole corner.


The transformer plus the surrounding parts were building a separate **floating power supply**. A little island of power that did not share a ground with the main pack. That is genuinely tidy engineering. The enable logic lives on an isolated domain so you cannot just yank it to the pack ground and call it a day.

We photographed and marked up that entire section so the relationships are clear.

![Isolation corner of the board with optocoupler, transformer, and support ICs marked](../../assets/blogs/unitree-battery/ic_debunk.jpeg)
*The isolation island. Optocoupler, transformer, and the floating supply that feeds the enable logic. Marked*

### The 10k that changed everything

While probing, one pin caught my attention. It was sitting at a non-standard voltage level. Definitely not a power rail.
So I decided to take a risk. Colleague stood ready with a fire extinguisher beside me, just in case, and I pulled that pin down through a **10k resistor**.

And BOOM!

The pack woke up. The babysitter stepped aside. The output rail came alive and we could pull current straight out of the pack.

![Bench shot of the pack enabled, multimeter showing live output voltage](../../assets/blogs/unitree-battery/battery_output.mp4)
*One 10k resistor in the right place. Output live. The pack finally decided to share.*

### Drawing power for real


For power testing, we loaded it with a 50 ohm 25W Power Resistor. 

So I = 33.6 / 50 = 0.672A
P = 0.672 * 33.6 = 22.57 W. < 25W, so it would heat up.
   
   and it did.

 It held. The output behaved exactly as a healthy pack should, and the data the BMS reports over RS485 matched what we measured at the terminals. Reported voltage tracked measured voltage. Reported current tracked the load.

![Power testing setup](../../assets/blogs/unitree-battery/decoded_structure.jpg)
*RS485 data check*


### Rolling our own PCB

To make this repeatable we did not want a breadboard hanging off the pack forever.

So we built a proper little interface board. For obvious prototyping purposes, we did it the old fashioned way, with an **etching process**, rather than ordering it out directly at first.

Layout, transfer, etch, drill, populate. The board handles the RS485 side, holds the enable circuit (yes, including the now famous pulldown), and gives us a clean place to read telemetry and draw power.

![Populated interface board connected to the BT02-6](../../assets/blogs/unitree-battery/pcb.mp4)
*Populated and wired to the pack. RS485 in, enable handled, power out. The whole thing on one board.*

## Closing thoughts

Here i am giving an closing statement. No wonder, unitree has done some amazingly serious piece of research and development about their electronics. They feel robust, and they work the same way. The designer has spent some real time thinking about the caveats, and what worst could possibly happen, like the user connects the PCB in reverse. 
Every-literal-thing is taken care of.

(However, this is also a testament to the fact that sometimes, no matter how much you try to lock things down, the curious hacker will always find a way in. It is a fun cat-and-mouse game.)

But it still came down to one isolated pin and one resistor. All the laser ablation in the world does not help once you have a microscope, a scope, and the patience to listen to what the board is actually doing.

Four screws. One 10k resistor. That was the whole story.

ideas:
- RFID tag on phone to auto-unlock PC
- remote PC control using IR remote, talk with serial
- controllables:
  - desk lights (w/ switch as manual override)
  - power switch (active low, connect to GND to trigger; drive it with a transistor? better with optocoupler. maybe redundant with serial, but actually useful for powering on)
  - bios clear (same as above?)
  - hibernate/sleep command (serial + non privileged daemon)
  - media controls (same)


maybe:
- PIR sensor for desktop "intruder alert" notifications

no:
- ~~talk with Raspberry Pi via I2C? SPI? to indirectly access network~~ not useful, just do everything with rpi gpio then
- ~~power attiny85 via internal rgb headers?~~ will stop when PC stops, needs separate serial comms anyway

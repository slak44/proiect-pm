import SerialPort from 'serialport';
// @ts-expect-error TS7016
import Readline from '@serialport/parser-readline';
import dbus from "dbus-next";
import { SerialMessage } from "./serial-message";
import { getMPRIS, getMPRISList, MPRISAccessor } from "./mpris-proxy";
import { nextLoopStatus } from "./loop-status";

if (!process.env.TTY_PATH) {
  console.error('No path in TTY_PATH');
  process.exit(1);
}

const port = new SerialPort(process.env.TTY_PATH);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

const bus = dbus.sessionBus();

setup();

function printActive(accessor: MPRISAccessor): void {
  console.info(`Active player: ${accessor.player.toString()}`);
}

async function setup(): Promise<void> {
  const accessor = new MPRISAccessor(await getMPRISList(bus));

  printActive(accessor);

  await listenToDBusChanges(accessor);

  // Start listening to messages on serial
  parser.on('data', (data: SerialMessage) => {
    try {
      handleSerialData(accessor, data);
    } catch (error) {
      console.error(error);
    }
  });
}

async function listenToDBusChanges(accessor: MPRISAccessor): Promise<void> {
  const dbusObject = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  const dbusInterface = dbusObject.getInterface('org.freedesktop.DBus');

  dbusInterface.on('NameOwnerChanged', (name: string, newOwner: string, oldOwner: string) => {
    if (name && !name.startsWith('org.mpris.MediaPlayer2')) {
      return;
    }

    const added = newOwner === '';
    const removed = oldOwner === '';
    if (added && removed) {
      // Ownership changed, don't care
      return;
    } else if (added) {
      getMPRIS(bus, name).then(mpris => accessor.onAdded(mpris));
    } else if (removed) {
      accessor.onRemoved(name);
    }
  });
}

async function handleSerialData(accessor: MPRISAccessor, data: SerialMessage) {
  const volumeDelta = 0.05;

  switch (data) {
    case SerialMessage.POWER:
      // TODO
      break;
    case SerialMessage.STOP:
      // Lights
      break;
    case SerialMessage.VOLUME_PLUS:
      await accessor.player.setVolume(await accessor.player.volume() + volumeDelta);
      break;
    case SerialMessage.VOLUME_MINUS:
      await accessor.player.setVolume(await accessor.player.volume() - volumeDelta);
      break;
    case SerialMessage.FAST_BACK:
      await accessor.player.previous();
      break;
    case SerialMessage.FAST_FORWARD:
      await accessor.player.next();
      break;
    case SerialMessage.PAUSE:
      await accessor.player.playPause();
      break;
    case SerialMessage.DOWN:
      accessor.prevPlayer();
      printActive(accessor);
      break;
    case SerialMessage.UP:
      accessor.nextPlayer();
      printActive(accessor);
      break;
    case SerialMessage.EQUAL:
      await accessor.player.setShuffle(!(await accessor.player.shuffle()))
      break;
    case SerialMessage.REPEAT:
      await accessor.player.setLoop(nextLoopStatus(await accessor.player.loop()));
      break;
  }
}


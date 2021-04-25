import SerialPort from 'serialport';
// @ts-ignore
import Readline from '@serialport/parser-readline';

if (!process.env.TTY_PATH) {
  console.error('No path in TTY_PATH');
  process.exit(1);
}

const path: string = process.env.TTY_PATH;

const port = new SerialPort(path);
const parser = port.pipe(new Readline());

parser.on('data', (data: string) => {
  console.log(data);
});

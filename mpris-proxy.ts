import type { MessageBus, ProxyObject } from 'dbus-next';
import { Variant } from "dbus-next";
import { LoopStatus } from "./loop-status";

const introspectedMpris = `
<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN" "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">
<node>
  <interface name="org.freedesktop.DBus.Introspectable">
    <method name="Introspect">
      <arg name="data" direction="out" type="s"/>
    </method>
  </interface>
  <interface name="org.freedesktop.DBus.Properties">
    <method name="Get">
      <arg name="interface" direction="in" type="s"/>
      <arg name="property" direction="in" type="s"/>
      <arg name="value" direction="out" type="v"/>
    </method>
    <method name="Set">
      <arg name="interface_name" direction="in" type="s"/>
      <arg name="property_name" direction="in" type="s"/>
      <arg name="value" direction="in" type="v"/>
    </method>
    <method name="GetAll">
      <arg name="interface" direction="in" type="s"/>
      <arg name="properties" direction="out" type="a{sv}"/>
    </method>
  </interface>
  <interface name="org.mpris.MediaPlayer2">
    <method name="Raise"></method>
    <method name="Quit"></method>
    <property name="CanQuit" type="b" access="read" />
    <property name="Fullscreen" type="b" access="readwrite" />
    <property name="CanRaise" type="b" access="read" />
    <property name="HasTrackList" type="b" access="read"/>
    <property name="Identity" type="s" access="read"/>
    <property name="DesktopEntry" type="s" access="read"/>
    <property name="SupportedUriSchemes" type="as" access="read"/>
    <property name="SupportedMimeTypes" type="as" access="read"/>
  </interface>
  <interface name="org.mpris.MediaPlayer2.Player">
    <method name="Next"/>
    <method name="Previous"/>
    <method name="Pause"/>
    <method name="PlayPause"/>
    <method name="Stop"/>
    <method name="Play"/>
    <method name="Seek">
      <arg direction="in" name="Offset" type="x"/>
    </method>
    <method name="SetPosition">
      <arg direction="in" name="TrackId" type="o"/>
      <arg direction="in" name="Position" type="x"/>
    </method>
    <method name="OpenUri">
      <arg direction="in" name="Uri" type="s"/>
    </method>
    <signal name="Seeked">
      <arg name="Position" type="x"/>
    </signal>
    <property name="PlaybackStatus" type="s" access="read"/>
    <property name="LoopStatus" type="s" access="readwrite"/>
    <property name="Rate" type="d" access="readwrite"/>
    <property name="Shuffle" type="b" access="readwrite"/>
    <property name="Metadata" type="a{sv}" access="read"></property>
    <property name="Volume" type="d" access="readwrite"/>
    <property name="Position" type="x" access="read"/>
    <property name="MinimumRate" type="d" access="read"/>
    <property name="MaximumRate" type="d" access="read"/>
    <property name="CanGoNext" type="b" access="read"/>
    <property name="CanGoPrevious" type="b" access="read"/>
    <property name="CanPlay" type="b" access="read"/>
    <property name="CanPause" type="b" access="read"/>
    <property name="CanSeek" type="b" access="read"/>
    <property name="CanControl" type="b" access="read"/>
  </interface>
  <interface name="org.mpris.MediaPlayer2.ExtensionSetRatings">
    <method name="SetRating">
      <arg direction="in" name="TrackId" type="o"/>
      <arg direction="in" name="Rating" type="d"/>
    </method>
    <property name="HasRatingsExtension" type="b" access="read"/>
  </interface>
</node>
`;

/**
 * Manual introspection:
 * ```
 * const introspectMessage = new Message({
 *     destination: interfaceName,
 *     path: '/org/mpris/MediaPlayer2',
 *     interface: 'org.freedesktop.DBus.Introspectable',
 *     member: 'Introspect',
 *     signature: '',
 *     body: []
 *   });
 *
 * console.log(await bus.call(introspectMessage));
 * ```
 */
export async function mprisProxy(bus: MessageBus, interfaceName: string): Promise<ProxyObject> {
  const mprisPath = '/org/mpris/MediaPlayer2';
  // Try auto-introspection
  const maybeGoodProxy = await bus.getProxyObject(interfaceName, mprisPath);
  if (Object.keys(maybeGoodProxy.interfaces).length === 0) {
    // Manually create proxy object with pre-introspected data. Might be inaccurate
    return await bus.getProxyObject(interfaceName, mprisPath, introspectedMpris);
  }
  return maybeGoodProxy;
}

/**
 * https://www.freedesktop.org/wiki/Specifications/mpris-spec/
 * https://wiki.archlinux.org/index.php/MPRIS
 */
export interface MPRIS {
  interfaceName: string;
  proxy: ProxyObject;

  next(): Promise<void>;
  previous(): Promise<void>;
  pause(): Promise<void>;
  play(): Promise<void>;
  playPause(): Promise<void>;
  stop(): Promise<void>;

  volume(): Promise<number>;
  setVolume(value: number): Promise<void>;

  shuffle(): Promise<boolean>;
  setShuffle(value: boolean): Promise<void>;

  loop(): Promise<LoopStatus>;
  setLoop(value: LoopStatus): Promise<void>;

  toString(): string;
}

export const EMPTY_MPRIS: MPRIS = {
  interfaceName: '',

  get proxy(): ProxyObject {
    throw Error('Mock object');
  },

  next: () => Promise.resolve(),
  previous: () => Promise.resolve(),
  pause: () => Promise.resolve(),
  play: () => Promise.resolve(),
  playPause: () => Promise.resolve(),
  stop: () => Promise.resolve(),

  volume: () => Promise.resolve(0),
  setVolume: _ => Promise.resolve(),

  shuffle: () => Promise.resolve(false),
  setShuffle: _ => Promise.resolve(),

  loop: () => Promise.resolve(LoopStatus.NONE),
  setLoop: _ => Promise.resolve(),
};

export async function getMPRIS(bus: MessageBus, interfaceName: string): Promise<MPRIS> {
  const playerObject = await mprisProxy(bus, interfaceName);
  const playerName = 'org.mpris.MediaPlayer2.Player';
  const playerInterface = playerObject.getInterface(playerName);
  const properties = playerObject.getInterface('org.freedesktop.DBus.Properties');

  return {
    interfaceName,
    proxy: playerObject,
    toString: () => interfaceName.replace('org.mpris.MediaPlayer2.', ''),

    next: () => playerInterface.Next(),
    previous: () => playerInterface.Previous(),
    pause: () => playerInterface.Pause(),
    play: () => playerInterface.Play(),
    stop: () => playerInterface.Stop(),
    playPause: () => playerInterface.PlayPause(),

    volume: () => properties.Get(playerName, 'Volume').then((variant: Variant) => variant.value),
    setVolume: value => properties.Set(playerName, 'Volume', new Variant('d', value)),

    shuffle: () => properties.Get(playerName, 'Shuffle').then((variant: Variant) => variant.value),
    setShuffle: value => properties.Set(playerName, 'Shuffle', new Variant('b', value)),

    loop: () => properties.Get(playerName, 'LoopStatus').then((variant: Variant) => variant.value),
    setLoop: value => properties.Set(playerName, 'LoopStatus', new Variant('s', value)),
  };
}

export async function getMPRISList(bus: MessageBus): Promise<MPRIS[]> {
  const object = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
  const namesInterface = object.getInterface('org.freedesktop.DBus');
  const names: string[] = await namesInterface.ListNames();
  const mprisNames = names.filter((name: string) => name.startsWith('org.mpris.MediaPlayer2'));

  return Promise.all(mprisNames.map(name => getMPRIS(bus, name)));
}

export class MPRISAccessor {
  private readonly mprisList: MPRIS[];
  private currentPlayerIdx: number = 0;

  constructor(initialList: MPRIS[]) {
    this.mprisList = initialList;
    this.sort();
  }

  private sort(): void {
    this.mprisList.sort((a, b) => a.interfaceName.localeCompare(b.interfaceName));
  }

  public onAdded(mpris: MPRIS): void {
    this.mprisList.push(mpris);
    this.sort();
  }

  public onRemoved(interfaceName: string): void {
    const index = this.mprisList.findIndex(mpris => mpris.interfaceName === interfaceName);
    if (index < 0) {
      return;
    }

    this.mprisList.splice(index, 1);
    this.sort();
    if (index <= this.currentPlayerIdx) {
      this.prevPlayer();
    }
  }

  public get player(): MPRIS {
    if (this.mprisList.length === 0) {
      return EMPTY_MPRIS;
    }

    return this.mprisList[this.currentPlayerIdx];
  }

  public nextPlayer(): void {
    this.currentPlayerIdx = (this.currentPlayerIdx + 1) % (this.mprisList.length || 1);
  }

  public prevPlayer(): void {
    const length = this.mprisList.length || 1;
    this.currentPlayerIdx = (this.currentPlayerIdx - 1 + length) % length;
  }
}

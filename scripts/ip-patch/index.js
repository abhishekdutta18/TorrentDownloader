import net from 'node:net';

export function toString(num, buf, offset) {
  num = Number(num);
  const octet1 = (num >>> 24) & 255;
  const octet2 = (num >>> 16) & 255;
  const octet3 = (num >>> 8) & 255;
  const octet4 = num & 255;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export function toLong(ip) {
  let i = 0;
  ip.split('.').forEach(octet => {
    i = (i << 8) + parseInt(octet, 10);
  });
  return i >>> 0;
}

export function isPrivate(addr) {
  return /^(::f{4}:)?(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|fe80:|::1)/i.test(addr);
}

export function isPublic(addr) {
  return !isPrivate(addr);
}

export function isLoopback(addr) {
  return /^127\./.test(addr) || addr === '::1';
}

export function isV4Format(addr) {
  return net.isIPv4(addr);
}

export function isV6Format(addr) {
  return net.isIPv6(addr);
}

export default {
  toString,
  toLong,
  isPrivate,
  isPublic,
  isLoopback,
  isV4Format,
  isV6Format
};

export const decodeBase64 = (encodedStr: string) => {
  const buff = Buffer.from(encodedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buff.toString('utf-8');
};

export const cleanString = (str: string) => {
  if (!str) return '';
  return str.replace(/\*/g, '').trim();
};

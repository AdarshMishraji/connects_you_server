export const isObjectEmpty = (obj: any) => {
  for (var _ in obj) {
    return false;
  }
  return true;
};

export const calculateNextExpireTime = (lastExpirationDuration: number) => {
  if (lastExpirationDuration) {
    if ([7, 32].includes(lastExpirationDuration)) {
      return 7;
    } else {
      return 2 * lastExpirationDuration;
    }
  } else {
    return 4;
  }
};

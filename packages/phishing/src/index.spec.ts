// Copyright 2020-2021 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress } from '@polkadot/util-crypto';

import addresses from '../../../address.json';
import allowed from '../../../known.json';
import { checkAddress, checkIfDenied } from '.';

describe('checkIfDenied', (): void => {
  it('returns false when host is not listed', async (): Promise<void> => {
    expect(
      await checkIfDenied('polkadot.network')
    ).toEqual(false);
  });

  it('returns false when host is not listed (with protocol)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkadot.network')
    ).toEqual(false);
  });

  it('returns true when host in list', async (): Promise<void> => {
    expect(
      await checkIfDenied('polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (www-prefix)', async (): Promise<void> => {
    expect(
      await checkIfDenied('www.polkadotfund.com')
    ).toEqual(true);
  });

  it('returns true when host in list (protocol)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (protocol + path)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkawallets.site/something/index.html')
    ).toEqual(true);
  });
});

describe('checkAddress', (): void => {
  it('returns null if the address is not found', async (): Promise<void> => {
    expect(
      await checkAddress('5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY')
    ).toEqual(null);
  });

  it('returns the site when the address is found', async (): Promise<void> => {
    expect(
      await checkAddress('14Vxs7UB9FqfQ53wwTJUBAJThs5N7b3bg89HscRU6eBqrFhQ')
    ).toEqual('polkadot.center');
  });

  it('returns the site even if the ss58 is different', async (): Promise<void> => {
    expect(
      await checkAddress('5FkmzcdNekhdSA7j4teSSyHGUnKT8bzNBFvVVeZSGmbSpYHH')
    ).toEqual('polkadots.network');
  });
});

describe('check additions', (): void => {
  it('has no malformed addresses', (): void => {
    const invalids = Object
      .entries(addresses as Record<string, string[]>)
      .map(([url, addrs]): [string, string[]] => {
        return [url, addrs.filter((a) => {
          try {
            return decodeAddress(a).length !== 32;
          } catch (error) {
            console.error(url, (error as Error).message);

            return true;
          }
        })];
      })
      .filter(([, addrs]) => addrs.length);

    if (invalids.length) {
      throw new Error(`Invalid ss58 checksum addresses found: ${invalids.map(([url, addrs]) => `\n\t${url}: ${addrs.join(', ')}`).join('')}`);
    }
  });

  it('has no entries on the known addresses list', (): void => {
    const added = Object
      .values(addresses as Record<string, string[]>)
      .reduce<string[]>((all, addrs) => all.concat(addrs), []);
    const dupes = Object
      .entries(allowed as Record<string, string[]>)
      .reduce<[string, string][]>((all, [site, addrs]) => all.concat(addrs.map((a) => [site, a])), [])
      .filter(([, a]) => added.includes(a));

    expect(dupes).toEqual([]);
  });
});

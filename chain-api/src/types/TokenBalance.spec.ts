import BigNumber from "bignumber.js";

import { TokenBalance, TokenHold } from "./TokenBalance";

/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function emptyBalance() {
  return new TokenBalance({
    collection: "test-collection",
    category: "test-category",
    type: "test-type",
    additionalKey: "test-additional-key",
    owner: "user1"
  });
}

function createHold(instance: BigNumber, expires: number) {
  return new TokenHold({
    createdBy: "user1",
    instanceId: instance,
    quantity: new BigNumber("1"),
    created: 1,
    expires: expires
  });
}

describe("fungible", () => {
  describe("should have tests for fungibles", () => {
    it("should add quantity", () => {
      // Given
      const balance = emptyBalance();

      // When
      balance.ensureCanAddQuantity(new BigNumber(1)).add();

      // Then
      expect(balance.getQuantityTotal()).toEqual(new BigNumber(1));
    });

    it("should fail to add quantity if balance contains NFT instances", () => {
      // Given
      const balance = emptyBalance();
      balance.ensureCanAddInstance(new BigNumber(1)).add();

      // When
      const error = () => balance.ensureCanAddQuantity(new BigNumber(1));

      // Then
      expect(error).toThrow("Attempted to perform FT-specific operation on balance containing NFT instances");
    });

    it("should fail to add quantity if quantity is invalid", () => {
      // Given
      const balance = emptyBalance();

      // When
      const error = () => balance.ensureCanAddQuantity(new BigNumber(-1));

      // Then
      expect(error).toThrow("FT quantity must be positive");
    });

    it("should subtract quantity", () => {
      // Given
      const balance = emptyBalance();

      // When
      balance.ensureCanAddQuantity(new BigNumber(1)).add();
      balance.ensureCanSubtractQuantity(new BigNumber(1)).subtract();

      // Then
      expect(balance.getQuantityTotal()).toEqual(new BigNumber(0));
    });

    it("should fail to subtract quantity if balance is insufficient", () => {
      // Given
      const balance = emptyBalance();

      // When
      const error = () => balance.ensureCanSubtractQuantity(new BigNumber(1));

      // Then
      expect(error).toThrow("Insufficient balance");
    });

    it("should fail to subtract quantity if balance contains NFT instances", () => {
      // Given
      const balance = emptyBalance();
      balance.ensureCanAddInstance(new BigNumber(1)).add();

      // When
      const error = () => balance.ensureCanSubtractQuantity(new BigNumber(1));

      // Then
      expect(error).toThrow("Attempted to perform FT-specific operation on balance containing NFT instances");
    });

    it("should fail to subtract quantity if quantity is invalid", () => {
      // Given
      const balance = emptyBalance();

      // When
      const error = () => balance.ensureCanSubtractQuantity(new BigNumber(-1));

      // Then
      expect(error).toThrow("FT quantity must be positive");
    });
  });
});

describe("non-fungible", () => {
  it("should add nft instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanAddInstance(new BigNumber(2)).add();

    // Then
    expect(balance.getNftInstanceCount()).toEqual(2);
  });

  it("should fail to add nft instance if instance already exists", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();

    const error = () => balance.ensureCanAddInstance(new BigNumber(1));

    // Then
    expect(error).toThrow("already exists in balance");
  });

  it("should fail to add nft instance if instance id is invalid", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();

    const errorZero = () => balance.ensureCanAddInstance(new BigNumber(0));
    const errorNegative = () => balance.ensureCanAddInstance(new BigNumber(0));
    const errorDecimal = () => balance.ensureCanAddInstance(new BigNumber(0));

    // Then
    expect(errorZero).toThrow("Instance ID must be positive integer");
    expect(errorNegative).toThrow("Instance ID must be positive integer");
    expect(errorDecimal).toThrow("Instance ID must be positive integer");
  });

  it("should remove nft instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanRemoveInstance(new BigNumber(1), Date.now()).remove();

    // Then
    expect(balance.getNftInstanceCount()).toEqual(0);
  });

  it("should fail to remove nft instance not in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.ensureCanRemoveInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to remove locked nft instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();
    const error = () => balance.ensureCanRemoveInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("is locked");
  });

  it("should fail to remove in use nft instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();
    const error = () => balance.ensureCanRemoveInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("is in use");
  });

  it("should lock instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [unexpiredHold]
      })
    );
  });

  it("should use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        inUseHolds: [unexpiredHold]
      })
    );
  });

  it("should fail to lock instance for non-nft instanceId", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(0), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddQuantity(new BigNumber(0)).add();
    const error = () => balance.ensureCanLockInstance(unexpiredHold).lock();

    // Then
    expect(error).toThrow("Instance ID must be positive integer");
  });

  it("should fail to use instance for non-nft instanceId", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(0), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddQuantity(new BigNumber(0)).add();
    const error = () => balance.ensureCanUseInstance(unexpiredHold).use();

    // Then
    expect(error).toThrow("Instance ID must be positive integer");
  });

  it("should fail to lock instance not in balance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    const error = () => balance.ensureCanLockInstance(unexpiredHold).lock();

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to use instance not in balance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    const error = () => balance.ensureCanUseInstance(unexpiredHold).use();

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to lock in use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();
    const error = () => balance.ensureCanLockInstance(unexpiredHold).lock();

    // Then
    expect(error).toThrow("is in use");
  });

  it("should fail to use instance already in use", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();
    const error = () => balance.ensureCanUseInstance(unexpiredHold).use();

    // Then
    expect(error).toThrow("is in use");
  });

  it("should fail to lock already locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();
    const error = () => balance.ensureCanLockInstance(unexpiredHold).lock();

    // Then
    expect(error).toThrow("is locked");
  });

  it("should fail to use locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();
    const error = () => balance.ensureCanUseInstance(unexpiredHold).use();

    // Then
    expect(error).toThrow("is locked");
  });

  it("should unlock locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();
    balance.ensureCanUnlockInstance(new BigNumber(1), undefined, Date.now()).unlock();

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: []
      })
    );
  });

  it("should fail to unlock already unlocked instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    const error = () => balance.ensureCanUnlockInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(error).toThrow("is not locked");
  });

  it("should release in use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();
    balance.ensureCanReleaseInstance(new BigNumber(1), undefined, Date.now()).release();

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        inUseHolds: []
      })
    );
  });

  it("should fail to release instance not in use", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    const error = () => balance.ensureCanReleaseInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(error).toThrow("is not in use");
  });

  it("should find locked hold", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();

    const foundHold = balance.findLockedHold(new BigNumber(1), undefined, Date.now());

    // Then
    expect(foundHold).toEqual(unexpiredHold);
  });

  it("should find in use hold", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();

    const foundHold = balance.findInUseHold(new BigNumber(1), undefined, Date.now());

    // Then
    expect(foundHold).toEqual(unexpiredHold);
  });

  it("should detect nft instance ids contained in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();

    const containsNft = balance.containsAnyNftInstanceId();

    // Then
    expect(containsNft).toEqual(true);
  });

  it("should be spendable if instance is in balance and free of holds", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();

    const isSpendable = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(isSpendable).toEqual(true);
  });

  it("should not be spendable if instance is not in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should not be spendable if instance is locked", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanLockInstance(unexpiredHold).lock();

    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should not be spendable if instance is in use", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanUseInstance(unexpiredHold).use();

    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should get correct instanceIds array from balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.ensureCanAddInstance(new BigNumber(1)).add();
    balance.ensureCanAddInstance(new BigNumber(2)).add();

    const instanceIds = balance.getNftInstanceIds();

    // Then
    expect(instanceIds).toEqual([new BigNumber(1), new BigNumber(2)]);
  });

  it("should clear holds", () => {
    // Given
    const hold6 = createHold(new BigNumber(6), 20);
    const hold7 = createHold(new BigNumber(7), 99);

    const balance = emptyBalance();
    balance.ensureCanAddInstance(new BigNumber(6)).add();
    balance.ensureCanAddInstance(new BigNumber(7)).add();
    balance.ensureCanLockInstance(hold6).lock();
    balance.ensureCanUseInstance(hold7).use();

    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [hold6],
        inUseHolds: [hold7]
      })
    );

    // Then
    balance.clearHolds(new BigNumber(1), 100);

    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [],
        inUseHolds: []
      })
    );
  });
});

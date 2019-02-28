class GlobalState {
  static async addPatch(patchName) {
    const state = await this._load();
    state.patches[patchName] = Date.now();
    await this._save(state);

    await this._expire(state);
  }

  static async getPatchCount() {
    const state = await this._load();
    return Object.keys(state.patches).length;
  }

  static async getExpireDays() {
    const state = await this._load();
    return state.expireDays;
  }

  static async setExpireDays(expireDays) {
    const state = await this._load();
    state.expireDays = expireDays;
    await this._save(state);
    await this._expire(state);
  }

  static async clear() {
    const state = await this._load();
    state.patches = {};
    await this._save(state);
  }

  static async _expire(state) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (this.expiring) {
      return;
    }
    if (now < state.lastExpireCheck + oneDay) {
      return;
    }

    this.expiring = true;

    state.lastExpireCheck = now;

    const expiredPatchNames = [];
    for (const patchName of Object.keys(state.patches)) {
      if (now > state.patches[patchName] + state.expireDays * oneDay) {
        delete state.patches[patchName];
        expiredPatchNames.push(patchName);
      }
    }

    await this._save(state);

    if (expiredPatchNames.length) {
      await browser.storage.local.remove(expiredPatchNames);
    }

    this.expiring = false;
  }

  static async _load() {
    const tmp = await browser.storage.local.get("globalState");
    if (!("globalState" in tmp)) {
      return {
        patches: {},
        lastExpireCheck: Date.now(),
        expireDays: 30,
      };
    }

    return JSON.parse(tmp.globalState);
  }

  static async _save(state) {
    await browser.storage.local.set({
      globalState: JSON.stringify(state),
    });
  }
}

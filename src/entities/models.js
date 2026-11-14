/**
 * Пакет Entities (Моделі даних предметної області)
 * Реалізує класи предметної області зі стереотипами <<Entity>>
 */

export class Category {
  constructor(id, name, slug, description) {
    this._id = id;
    this._name = name;
    this._slug = slug;
    this._description = description;
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get slug() {
    return this._slug;
  }
  get description() {
    return this._description;
  }

  getName() {
    return this._name;
  }
}

export class Article {
  constructor(data) {
    this._id = data.id;
    this._title = data.title;
    this._content = data.content;
    this._summary = data.summary;
    this._categoryId = data.categoryId;
    this._patchVersion = data.patchVersion;
    this._isOffline = Boolean(data.isOffline);
    this._readTimeMinutes = data.readTimeMinutes;
    this._keyStats = data.keyStats;
    this._author = data.author || 'RustHelper Team';
    this._status = data.status || 'published';
  }

  get id() {
    return this._id;
  }
  get title() {
    return this._title;
  }
  get content() {
    return this._content;
  }
  get summary() {
    return this._summary;
  }
  get categoryId() {
    return this._categoryId;
  }
  get patchVersion() {
    return this._patchVersion;
  }
  get isOffline() {
    return this._isOffline;
  }
  set isOffline(val) {
    this._isOffline = Boolean(val);
  }
  get readTimeMinutes() {
    return this._readTimeMinutes;
  }
  get keyStats() {
    return this._keyStats;
  }
  get author() {
    return this._author;
  }
  get status() {
    return this._status;
  }

  getContent() {
    return this._content;
  }

  persist() {
    this._isOffline = true;
    return true;
  }

  toJSON() {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      summary: this._summary,
      categoryId: this._categoryId,
      patchVersion: this._patchVersion,
      isOffline: this._isOffline,
      readTimeMinutes: this._readTimeMinutes,
      keyStats: this._keyStats,
      author: this._author,
      status: this._status,
    };
  }
}

export class DataPackage {
  constructor(version, patchName, sizeMb, lastSyncedAt, articles = []) {
    this._version = version;
    this._patchName = patchName;
    this._sizeMb = sizeMb;
    this._lastSyncedAt = lastSyncedAt;
    this._articles = articles;
  }

  getVersion() {
    return this._version;
  }

  setVersion(v) {
    this._version = v;
  }

  get sizeMb() {
    return this._sizeMb;
  }
  get patchName() {
    return this._patchName;
  }
  get lastSyncedAt() {
    return this._lastSyncedAt;
  }
  get articles() {
    return this._articles;
  }
}

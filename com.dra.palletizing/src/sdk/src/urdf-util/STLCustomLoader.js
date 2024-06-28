/* eslint-disable no-param-reassign */
/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

import { FileLoader, Cache } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';


export class STLCustomLoader extends STLLoader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const scope = this;

    const loader = new CustomFileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('arraybuffer');
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);

    loader.load(url, function (text) {

      try {

        onLoad(scope.parse(text));

      } catch (e) {

        if (onError) {

          onError(e);

        } else {

          // fix eslint

        }

        scope.manager.itemError(url);

      }

    }, onProgress, onError);
  }
}


class CustomFileLoader extends FileLoader {
  loading = {};
  load(url, onLoad, onProgress, onError) {
    if (url === undefined) url = '';

    if (this.path !== undefined) url = this.path + url;

    url = this.manager.resolveURL(url);

    const cached = Cache.get(url);

    if (cached !== undefined) {

      this.manager.itemStart(url);

      setTimeout(() => {

        if (onLoad) onLoad(cached);

        this.manager.itemEnd(url);

      }, 0);

      return cached;

    }

    // Check if request is duplicate

    if (this.loading[url] !== undefined) {

      this.loading[url].push({

        onLoad: onLoad,
        onProgress: onProgress,
        onError: onError

      });

      return;

    }

    // Initialise array for duplicate requests
    this.loading[url] = [];

    this.loading[url].push({
      onLoad: onLoad,
      onProgress: onProgress,
      onError: onError,
    });
    const loadXhr = new XMLHttpRequest();
    Object.keys(this.requestHeader).forEach(header=>{
      loadXhr.setRequestHeader(header, this.requestHeader[header]);
    })
    loadXhr.responseType = this.responseType;
    loadXhr.onprogress = (response) => {
      if (response.target.status === 200 || response.target.status === 0) {
        if (response.target.status === 0) {
          // Fix eslint
        }
        const callbacks = this.loading[url];
        for (let i = 0, il = callbacks.length; i < il; i++) {
          const callback = callbacks[i];
          if (callback.onProgress) {
            const event = new ProgressEvent('progress', {
              lengthComputable: response.target.total !== 0,
              loaded: response.target.loaded,
              total: response.target.total
            });
            callback.onProgress(event);
          }
        }
      } else {
        throw Error(`fetch for "${response.target.url}" responded with 
          ${response.target.status}: ${response.target.statusText}`);
      }
    }
    loadXhr.onload = (data) => {
      Cache.add(url, data.target.response);
      const callbacks = this.loading[url];
      delete this.loading[url];
      for (let i = 0, il = callbacks.length; i < il; i++) {
        const callback = callbacks[i];
        if (callback.onLoad) callback.onLoad(data.target.response);
      }
      this.manager.itemEnd(url);
    }
    loadXhr.onerror = (err) => {
      const callbacks = this.loading[url];
      if (callbacks === undefined) {
        this.manager.itemError(url);
        throw err;
      }
      delete this.loading[url];
      for (let i = 0, il = callbacks.length; i < il; i++) {
        const callback = callbacks[i];
        if (callback.onError) callback.onError(err);
      }
      this.manager.itemError(url);
      this.manager.itemEnd(url);
    }
    loadXhr.open('GET', url)
    loadXhr.send();
    this.manager.itemStart(url);

  }
}
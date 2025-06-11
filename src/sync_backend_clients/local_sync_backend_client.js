import fs from 'fs';
import pathModule from 'path';
import { fromJS, Map } from 'immutable';

export default basePath => {
    const isSignedIn = () => {
        console.log('Using local sync backend client');
        return Promise.resolve(true);
    };

    const transformDirectoryListing = listing =>
          fromJS(
              listing.map(entry => ({
                  id: entry,
                  name: pathModule.basename(entry),
                  isDirectory: fs.statSync(entry).isDirectory(),
                  path: entry.replace(basePath, ''),
              }))
          );

    const getDirectoryListing = path =>
          new Promise((resolve, reject) => {
              const fullPath = pathModule.join(basePath, path);
              fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
                  if (err) return reject(err);
                  const entries = files.map(f => pathModule.join(fullPath, f.name));
                  resolve({
                      listing: transformDirectoryListing(entries),
                      hasMore: false,
                      additionalSyncBackendState: Map(),
                  });
              });
          });

    const getMoreDirectoryListing = () =>
          Promise.resolve({
              listing: fromJS([]),
              hasMore: false,
              additionalSyncBackendState: Map(),
          });

    const uploadFile = (relativePath, contents) =>
          new Promise((resolve, reject) => {
              const fullPath = pathModule.join(basePath, relativePath);
              fs.mkdir(pathModule.dirname(fullPath), { recursive: true }, err => {
                  if (err) return reject(err);
                  fs.writeFile(fullPath, contents, err => {
                      if (err) return reject(err);
                      resolve();
                  });
              });
          });

    const getFileContentsAndMetadata = relativePath =>
          new Promise((resolve, reject) => {
              const fullPath = pathModule.join(basePath, relativePath);
              fs.stat(fullPath, (err, stats) => {
                  if (err) return reject(err);
                  fs.readFile(fullPath, 'utf8', (err, contents) => {
                      if (err) return reject(err);
                      resolve({
                          contents,
                          lastModifiedAt: stats.mtime,
                      });
                  });
              });
          });

    const getFileContents = path =>
          getFileContentsAndMetadata(path).then(({ contents }) => contents);

    const deleteFile = relativePath =>
          new Promise((resolve, reject) => {
              const fullPath = pathModule.join(basePath, relativePath);
              fs.unlink(fullPath, err => {
                  if (err) return reject(err);
                  resolve();
              });
          });

    return {
        type: 'Local',
        isSignedIn,
        getDirectoryListing,
        getMoreDirectoryListing,
        updateFile: uploadFile,
        createFile: uploadFile,
        getFileContentsAndMetadata,
        getFileContents,
        deleteFile,
    };
};

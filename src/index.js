import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
// Import React FilePond
import { FilePond, registerPlugin } from 'react-filepond';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import './styles.css';

// Import the Image EXIF Orientation and Image Preview plugins
// Note: These need to be installed separately
// `npm i filepond-plugin-image-preview filepond-plugin-image-exif-orientation --save`
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

// const CHUNK_SIZE = 5 * 1024 * 1024;

const Row = ({ name, value }) => {
  return (
    <div key={name} className="row">
      <label>{name}</label> {value}
    </div>
  );
};

const Obj = ({ obj }) => {
  return Object.keys(obj).map(key => {
    const value = obj[key];
    if (key === '@type') return null;
    if (typeof value === 'object') {
      return <Obj key={key} obj={value} />;
    }
    if (typeof obj[key] !== 'string') return null;
    return <Row key={key} name={key} value={value} />;
  });
};

function App() {
  const [isMediaInfoLoaded, setMediaInfoLoaded] = useState(false);
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(null);
  // const miLib = useRef(null);
  const mi = useRef(null);
  // const x2js = useRef(null);
  const processing = useRef(false);
  const MediaInfoModule = useRef(false);

  useEffect(() => {
    MediaInfoModule.current = window.MediaInfoLib({
      postRun: function() {
        console.debug('MediaInfo ready');
        setMediaInfoLoaded(true);
      }
    });
  }, []);

  const finish = function() {
    mi.current.Close();
    mi.current.delete();
    processing.current = false;
  };

  var parseFile = function(file, callback) {
    if (processing.current) {
      return;
    }
    processing.current = true;

    // var offset = 0;

    // Initialise MediaInfo
    mi.current = new MediaInfoModule.current.MediaInfo();

    //Open the file
    mi.current.Open(file, callback);

    /* By buffer example:
    mi.current.Option('File_FileName', file.name);
    mi.current.Open_Buffer_Init(file.size, 0);

    var loop = function(length) {
      if (processing.current) {
        var r = new FileReader();
        var blob = file.slice(offset, offset + length);
        r.onload = processChunk;
        r.readAsArrayBuffer(blob);
      } else {
        finish()
      }
    };

    var processChunk = function(e) {
      if (e.target.error === null) {
        // Send the buffer to MediaInfo
        var state = mi.current.Open_Buffer_Continue(e.target.result);

        //Test if there is a MediaInfo request to go elsewhere
        var seekTo = mi.current.Open_Buffer_Continue_Goto_Get();
        if(seekTo === -1) {
          offset += e.target.result.byteLength;
        } else {
          offset = seekTo;
          mi.current.Open_Buffer_Init(file.size, seekTo); // Inform MediaInfo we have seek
        }
      } else {
        finish();
        alert('An error happened reading your file!');
        return;
      }

      // Bit 3 set means finalized
      if (state&0x08 || e.target.result.byteLength < 1) {
        mi.current.Open_Buffer_Finalize();
        callback();
        return;
      }

      loop(CHUNK_SIZE);
    };

     // Start
    loop(CHUNK_SIZE);*/
  };

  useEffect(() => {
    if (files.length > 0)
      parseFile(files[0].file, () => {
        mi.current.Option('Inform', 'JSON');
        setData(JSON.parse(mi.current.Inform()));
      });
    else {
      setData(null);
      if (mi.current) finish();
    }
  }, [files]);

  return (
    <div className="App">
      <FilePond
        disabled={!isMediaInfoLoaded}
        files={files}
        allowMultiple={false}
        onupdatefiles={setFiles}
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
      />
      {data && (
        <div className="data">
          {data.media.track.map(track => (
            <div className="track" key={track['@type']}>
              <div className="title">{track['@type']}</div>
              <Obj obj={track} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);

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

const CHUNK_SIZE = 5 * 1024 * 1024;

function App() {
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(null);
  const miLib = useRef(null);
  const mi = useRef(null);
  const x2js = useRef(null);
  const processing = useRef(false);

  useEffect(() => {
    miLib.current = window.MediaInfo(function() {
      mi.current = new miLib.current.MediaInfo();
    });
    x2js.current = new window.X2JS();
  }, []);

  function addResult(name, result) {
    const resultObj = x2js.current.xml_str2json(result);
    resultObj.date = new Date();
    resultObj.fileName = name;
    setData(resultObj);
  }

  function parseFile(file) {
    if (processing.current) {
      return;
    }
    processing.current = true;

    var fileSize = file.size,
      offset = 0,
      state = 0,
      // seekTo = -1,
      seek = null;

    mi.current.open_buffer_init(fileSize, offset);

    var processChunk = function(e) {
      var l;
      if (e.target.error === null) {
        var chunk = new Uint8Array(e.target.result);
        l = chunk.length;
        state = mi.current.open_buffer_continue(chunk, l);

        var seekTo = -1;
        var seekToLow = mi.current.open_buffer_continue_goto_get_lower();
        var seekToHigh = mi.current.open_buffer_continue_goto_get_upper();

        if (seekToLow === -1 && seekToHigh === -1) {
          seekTo = -1;
        } else if (seekToLow < 0) {
          seekTo = seekToLow + 4294967296 + seekToHigh * 4294967296;
        } else {
          seekTo = seekToLow + seekToHigh * 4294967296;
        }

        if (seekTo === -1) {
          offset += l;
        } else {
          offset = seekTo;
          mi.current.open_buffer_init(fileSize, seekTo);
        }
        chunk = null;
      } else {
        var msg = 'An error happened reading your file!';
        console.err(msg, e.target.error);
        processingDone();
        alert(msg);
        return;
      }
      // bit 4 set means finalized
      if (state & 0x08) {
        var result = mi.current.inform();
        mi.current.close();
        addResult(file.name, result);
        processingDone();
        return;
      }
      seek(l);
    };

    function processingDone() {
      processing.current = false;
    }

    seek = function(length) {
      if (processing.current) {
        var r = new FileReader();
        var blob = file.slice(offset, length + offset);
        r.onload = processChunk;
        r.readAsArrayBuffer(blob);
      } else {
        mi.current.close();
        processingDone();
      }
    };

    // start
    seek(CHUNK_SIZE);
  }

  useEffect(() => {
    if (files.length > 0) parseFile(files[0].file);
    else setData(null);
  }, [files]);

  return (
    <div className="App">
      <FilePond
        files={files}
        allowMultiple={false}
        onupdatefiles={setFiles}
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
      />
      {data && (
        <div className="data">
          {data.File.track.map(track => (
            <div className="track">
              <div className="title">{track['_type']} Track</div>
              {Object.keys(track).map(key => (
                <div key={key} className="row">
                  <label>{key}</label> {track[key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);

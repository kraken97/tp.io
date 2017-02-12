import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { compose, withState, withHandlers, withProps, mapProps } from 'recompose'

var socket = new WebSocket("ws://localhost:8082");

const style = {
    console: {
        width: '100%',
        background: '#607D8B',
        height: '150px',
        padding: '29px',
        overflowX: 'scroll'
    }

}

const Console = ({ msg }) => <div style={style.console} dangerouslySetInnerHTML={{ __html: msg }}></div>;

const Editor = ({ setSelectedIndex, logMsg, code, files, onFileChange, editorDidMount, options }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ width: '100%', height: '80px', background: '#3f51b5' }}>

        </div>
        <div style={{ display: 'flex', width: '100%' }}>
            <ul >
                {
                    files.map((el, i) =>
                        <li key={i} onClick={el => setSelectedIndex(i)}> <a> {el.name} </a></li>)
                }
            </ul>
            <div style={{ flex: '1' }}>
                <MonacoEditor
                    width="1000px"
                    height="700"
                    language={code.type}
                    value={code.value}
                    options={options}
                    onChange={onFileChange}
                    editorDidMount={editorDidMount}
                />
            </div>
        </div>
        <Console msg={logMsg} />
    </div>
);



const defaultDockerConfig = 'from node \n add ./ /var \n run node /var/main.js'
const defaultJs = 'console.log("hello")'
const defaultFiles = [{
    name: 'main.js',
    value: defaultJs,
    type: 'javascript'
},
{
    name: 'dockerfile',
    value: defaultDockerConfig,
    type: 'dockerfile'
}]

const enhance = compose(
    withState('selectedFileIndex', 'setSelectedIndex', 0),
    withState('logMsg', 'setLogMsg', ''),
    withState('files', 'setFiles', defaultFiles),
    withHandlers({
        updateLog: ({ logMsg, setLogMsg }) => ({ data }) => setLogMsg(logMsg + '<br/>' + data),
        onFileChange: ({ files, selectedFileIndex, setFiles }) => (newValue, e) => {
            socket.send(JSON.stringify({ files }));
            files[selectedFileIndex].value = newValue;
            setFiles(files);
        }
    }),
    withHandlers({
        editorDidMount: ({ updateLog }) => (editor, monaco) => {
            editor.focus();
            socket.onmessage = (data) => updateLog(data);
        }
    }),
    withProps({
        options: {
            selectOnLineNumbers: true
        }
    }),
    withProps(({ files, selectedFileIndex, }) => ({ code: files[selectedFileIndex] }))
)

export default enhance(Editor);
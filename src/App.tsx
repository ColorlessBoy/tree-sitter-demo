import { useEffect, useState } from 'react';
import Parser from 'web-tree-sitter'; 
import { Editor } from '@monaco-editor/react';
import './App.css';

function App() {
  const [parser, setParser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("def Prop := Sort(0)\ndef Iff : Prop -> Prop -> Prop");
  const [ast, setAst] = useState<string>('');
  const [error, setError] = useState<string>('');

  const printTree = (node: any, level: number = 0): string => {
    if (!node) return '';
    
    const indent = '  '.repeat(level);
    let result = '';
    
    // Add node type and position info
    if (node.type === 'ERROR') {
      result += `${indent}❌ ERROR`;
    } else {
      result += `${indent}${node.type}`;
    }
    
    // Add position information
    result += ` (${node.startPosition.row}:${node.startPosition.column}-${node.endPosition.row}:${node.endPosition.column})`;
    
    if (node.text && node.text.trim()) {
      result += ` [${node.text}]`;
    }
    result += '\n';

    let child = node.firstChild;
    while (child) {
      result += printTree(child, level + 1);
      child = child.nextSibling;
    }
    return result;
  };

  const formatError = (error: any): string => {
    let errorMsg = '';
    
    // 错误名称和消息
    errorMsg += `错误类型: ${error.name || '未知错误'}\n`;
    errorMsg += `错误信息: ${error.message || error.toString()}\n`;
    
    // 错误堆栈
    if (error.stack) {
      errorMsg += `\n堆栈信息:\n${error.stack}`;
    }
    
    // 额外的错误属性
    const additionalInfo = Object.entries(error)
      .filter(([key]) => !['name', 'message', 'stack'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
      
    if (additionalInfo) {
      errorMsg += `\n\n额外信息:\n${additionalInfo}`;
    }
    
    return errorMsg;
  };

  useEffect(() => {
    let mounted = true;

    async function initParser() {
      try {
        await Parser.init(); 
        const parser = new Parser();
        const JavaScript = await Parser.Language.load('/tree-sitter-follow.wasm');
        parser.setLanguage(JavaScript);
        if (mounted) {
          setParser(parser);
          setLoading(false);
          try {
            const tree = parser.parse(code);
            const treeStr = printTree(tree.rootNode);
            console.log('Full Tree:', treeStr); 
            setAst(treeStr);
            setError('');
          } catch (parseError) {
            const errorMsg = formatError(parseError);
            console.error('Parse Error:', errorMsg);
            setError(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = formatError(error);
        console.error('Parser Initialization Error:', errorMsg);
        if (mounted) {
          setLoading(false);
          setError(errorMsg);
        }
      }
    }

    initParser();
    return () => {
      mounted = false;
    };
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);
    if (parser) {
      try {
        const tree = parser.parse(value);
        const treeStr = printTree(tree.rootNode);
        console.log('Full Tree:', treeStr); 
        setAst(treeStr);
        setError('');
      } catch (parseError) {
        const errorMsg = formatError(parseError);
        console.error('Parse Error:', parseError);
        setError(errorMsg);
      }
    }
  };

  if (loading) {
    return <div>Loading parser...</div>;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      overflow: 'hidden'
    }}>
      <div style={{ 
        flex: '1 1 50%', 
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid #ddd'
      }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>代码编辑器</h3>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            height="100%"
            defaultLanguage="txt"
            value={code}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineHeight: 1.5
            }}
          />
        </div>
      </div>
      <div style={{ 
        flex: '1 1 50%', 
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>AST树</h3>
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          padding: '8px'
        }}>
          <pre style={{ 
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            textAlign: 'left',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            {ast.trimStart()}
          </pre>
          {error && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              fontSize: '13px',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
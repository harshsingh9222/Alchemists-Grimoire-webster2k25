// Minimal editor themes and configs used by the enhanced editor
export const customThemes = {
  'vs-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {},
  },
  'vs-light': {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {},
  },
  'dracula': {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {},
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {},
  },
}

export const editorConfig = {
  fontSize: 14,
  wordWrap: 'on',
  minimap: {
    enabled: true,
  },
  tabSize: 2,
}

export const languageConfigs = {
  javascript: { name: 'javascript', defaultCode: '// JavaScript\nconsole.log("Hello World")' },
  python: { name: 'python', defaultCode: '# Python\nprint("Hello World")' },
  cpp: { name: 'cpp', defaultCode: '// C++\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){ cout << "Hello"; }' },
  java: { name: 'java', defaultCode: '// Java\npublic class Main{ public static void main(String[] args){ System.out.println("Hello"); } }' },
}

export default { customThemes, editorConfig, languageConfigs }

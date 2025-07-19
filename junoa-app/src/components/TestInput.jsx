import React, { useState } from 'react';

const TestInput = () => {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="p-4 border rounded">
      <h3>Test Input Component</h3>
      <div className="mb-4">
        <label>Text Input:</label>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            console.log('Test text input:', e.target.value);
            setText(e.target.value);
          }}
          className="border p-2 w-full"
          placeholder="Type here..."
        />
        <p>Current value: {text}</p>
      </div>
      
      <div className="mb-4">
        <label>Email Input:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            console.log('Test email input:', e.target.value);
            setEmail(e.target.value);
          }}
          className="border p-2 w-full"
          placeholder="email@example.com"
        />
        <p>Current value: {email}</p>
      </div>
      
      <div className="mb-4">
        <label>Textarea:</label>
        <textarea
          value={text}
          onChange={(e) => {
            console.log('Test textarea:', e.target.value);
            setText(e.target.value);
          }}
          className="border p-2 w-full h-20"
          placeholder="Type here..."
        />
      </div>
    </div>
  );
};

export default TestInput; 
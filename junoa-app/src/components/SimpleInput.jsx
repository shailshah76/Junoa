import React, { useState } from 'react';

const SimpleInput = () => {
  const [localText, setLocalText] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  return (
    <div className="p-4 border-2 border-red-500 rounded bg-yellow-50">
      <h3 className="text-lg font-bold mb-4">Isolated Input Test</h3>
      
      <div className="mb-4">
        <label className="block mb-2">Local Text Input:</label>
        <input
          type="text"
          value={localText}
          onChange={(e) => {
            console.log('Local text input value:', e.target.value);
            setLocalText(e.target.value);
          }}
          className="border-2 border-blue-500 p-2 w-full"
          placeholder="Type here..."
        />
        <p className="text-sm mt-1">Current: "{localText}"</p>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Local Email Input:</label>
        <input
          type="email"
          value={localEmail}
          onChange={(e) => {
            console.log('Local email input value:', e.target.value);
            setLocalEmail(e.target.value);
          }}
          className="border-2 border-blue-500 p-2 w-full"
          placeholder="email@example.com"
        />
        <p className="text-sm mt-1">Current: "{localEmail}"</p>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Local Textarea:</label>
        <textarea
          value={localText}
          onChange={(e) => {
            console.log('Local textarea value:', e.target.value);
            setLocalText(e.target.value);
          }}
          className="border-2 border-blue-500 p-2 w-full h-20"
          placeholder="Type here..."
        />
      </div>
    </div>
  );
};

export default SimpleInput; 
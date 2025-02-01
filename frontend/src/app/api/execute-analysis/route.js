const executeAnalysis = async (symbol) => {
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to execute analysis');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error executing analysis:', error);
      throw error;
    }
  };
  
  // For symbol search
  const searchSymbols = async (query) => {
    try {
      const response = await fetch(`http://localhost:5000/api/symbols/search?q=${query}`);
      if (!response.ok) {
        throw new Error('Failed to search symbols');
      }
      return response.json();
    } catch (error) {
      console.error('Error searching symbols:', error);
      throw error;
    }
  };
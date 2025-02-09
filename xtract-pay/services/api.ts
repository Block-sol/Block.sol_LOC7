// services/api.ts

export const processReceipt = async (file: File, phone_number:string) => {
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('phone_number', phone_number || '');
    console.log(formData)
  
    try {
      const response = await fetch('https://077a-2409-40c0-70-e99f-c847-485f-7e0-9802.ngrok-free.app/process-receipt', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process receipt');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  };
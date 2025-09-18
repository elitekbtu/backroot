import React from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalAR from '../components/UniversalAR';

const UniversalARPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/ar');
  };

  return (
    <div className="min-h-screen">
      <UniversalAR onBack={handleBack} />
    </div>
  );
};

export default UniversalARPage;

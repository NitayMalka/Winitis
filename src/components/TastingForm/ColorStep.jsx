// Winitis: src/components/TastingForm/ColorStep.jsx (photo-based colour picking)
import React from 'react';
import { useTexts } from '../../context/TextContext';
import PhotoColorStep from './PhotoColor/PhotoColorStep.jsx';

export default function ColorStep({ colorData, updateColorData }) {
  const { t } = useTexts();
  return <PhotoColorStep colorData={colorData} updateColorData={updateColorData} t={t} />;
}

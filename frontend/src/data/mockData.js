import { RiAppsLine, RiSmartphoneLine, RiHeadphoneLine, RiWirelessChargingLine, RiGamepadLine } from 'react-icons/ri';
import React from 'react';

export const categories = [
  { name: 'All', icon: React.createElement(RiAppsLine, { className: "w-5 h-5 mb-1" }) },
  { name: 'Smart Devices', icon: React.createElement(RiSmartphoneLine, { className: "w-5 h-5 mb-1" }) },
  { name: 'Audio Gear', icon: React.createElement(RiHeadphoneLine, { className: "w-5 h-5 mb-1" }) },
  { name: 'Premium Wearables', icon: React.createElement(RiWirelessChargingLine, { className: "w-5 h-5 mb-1" }) },
  { name: 'Gaming Setup', icon: React.createElement(RiGamepadLine, { className: "w-5 h-5 mb-1" }) }
];

export const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

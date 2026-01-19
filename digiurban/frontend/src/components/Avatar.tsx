import React from 'react';
import { getAvatarData } from '../utils/avatar';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const avatar = getAvatarData(name, avatarUrl);

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${className}`;

  if (avatar.type === 'image') {
    return (
      <img
        src={avatar.value}
        alt={name}
        className={`${baseClasses} object-cover`}
      />
    );
  }

  return (
    <div
      className={baseClasses}
      style={{
        backgroundColor: avatar.bgColor,
        color: avatar.textColor,
      }}
    >
      {avatar.value}
    </div>
  );
};

export default Avatar;

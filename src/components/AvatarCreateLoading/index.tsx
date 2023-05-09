import React from 'react';
import FadeLoader from 'react-spinners/MoonLoader';

function AvatarCreateLoading() {
	return (
		<div className="contentWrap">
			<div
				style={{
					position: 'fixed',
					zIndex: 1,
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			>
				<FadeLoader color="#36d7b7" size={100} />
			</div>

			<h3
				style={{
					position: 'fixed',
					zIndex: 1,
					top: '60%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			>
				아바타를 업로드 하는 중입니다...
			</h3>
		</div>
	);
}

export default AvatarCreateLoading;

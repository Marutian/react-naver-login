import * as React from 'react';

const NAVER_ID_SDK_URL = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.0.js';

interface IProps {
  clientId: string;
  callbackUrl: string;
  render: (props: any) => React.ComponentElement<any, any> | Element | JSX.Element;
  onSuccess: (result: any) => void;
  onFailure: (result: any) => void;
}

interface IState {}

/**
 * 이 함수는 브라우저 환경에서만 호출이 되야 한다. window 객체에 직접 접근한다.
 * @param props 
 */
const initLoginButton = (props: IProps) => {
  if(!('browser' in process)) {
    return;
  }
  const { clientId, callbackUrl} = props;
  const { location } = { ...window};
  const naver = window['naver'];

  const naverLogin = new naver.LoginWithNaverId(
    {
      callbackUrl,
      clientId,
      isPopup: true,
      loginButton: {color: "green", type: 3, height: 60},
    }
  );

  naverLogin.init();
  let tryCount = 0;
  const initLoop = setInterval(() => {
    if(tryCount > 30) {
      clearInterval(initLoop);
    }
    naverLogin.getLoginStatus((status: any) => {
      if (!status || location.hash.indexOf('#access_token') === -1) {
         return;
      }
      window.opener.naver.successCallback(naverLogin.user);
      window.close();
    })
    tryCount++;
  }, 100);
};

const loadScript = () => {
  if (document && document.querySelectorAll('#naver-login-sdk').length === 0) {
    const script = document.createElement('script');
    script.id = 'naver-login-sdk';
    script.src = NAVER_ID_SDK_URL;
    document.head.appendChild(script);
  }
}
const appendNaverButton = () => {
  if (document && document.querySelectorAll('#naverIdLogin').length === 0) {
    const naverId = document.createElement('div');
    naverId.id = 'naverIdLogin';
    naverId.style.position =  'absolute';
    naverId.style.top = '-10000px';
    document.body.appendChild(naverId);
  }
}

class LoginNaver extends React.Component<IProps, IState> {
   componentDidMount() {
    if(!('browser' in process)) {
      return;
    }

    let tryCount = 0;
    const initLoop = setInterval(() => {
      if (tryCount > 30) {
        clearInterval(initLoop);
        return;
      }

      loadScript()
      appendNaverButton();  
      
      if('naver' in window) {
        const naver: any = window['naver'];
        naver.successCallback = (data: any) => this.props.onSuccess(data);
        initLoginButton(this.props)
        // 구글 로그인이랑 같이 사용하면 한 번에 초기화 안되는 버그가 있다.
        setTimeout(() => initLoginButton(this.props), 1000)
        clearInterval(initLoop);
      }
      tryCount++;
    }, 100);
    
  }
    

  public render() {
    const { render } = this.props;
    return (
      render && render({ 
        onClick: () => { 
          if (!document || !(document as any).querySelector('#naverIdLogin').firstChild) return;
          const naverLoginButton: any = (document as any).querySelector('#naverIdLogin').firstChild;
          naverLoginButton.click();
        }
      })
    )
  }
}

export default LoginNaver;
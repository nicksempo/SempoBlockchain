import React from 'react';
import MediaQuery from 'react-responsive'
import classNames from 'classnames';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Link, NavLink } from 'react-router-dom';

import { loginRequest, logout } from '../reducers/authReducer'

const mapStateToProps = (state) => {
  return {
    loggedIn: (state.login.token != null),
    email: state.login.email
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

class NavBar extends React.Component {
    constructor() {
        super();
        this.state = {
          iconURL: '/static/media/sempo_icon.svg',
          mobileMenuOpen: false,
        };
    }

    componentWillMount() {
      let deploymentName = window.DEPLOYMENT_NAME;

      let custom_url = `https://s3.amazonaws.com/sempoctp-${deploymentName}/icon.${deploymentName === 'dev' ? 'svg' : 'png'}`;

      this.imageExists(custom_url,(exists) => {
        if (exists) {
          this.setState({
            iconURL: custom_url
          })
        }
      })
    }

  componentWillUnmount() {
        this.setState({mobileMenuOpen: false})
    }

    handleClick() {
      this.setState({mobileMenuOpen: false})
    }

    openMobileMenu() {
        this.setState(prevState => ({
          mobileMenuOpen: !prevState.mobileMenuOpen
        }));
    }

    imageExists(url, callback) {
      var img = new Image();
      img.onload = function() { callback(true); };
      img.onerror = function() { callback(false); };
      img.src = url;
    }

    _closeMobileMenu() {
      this.setState({mobileMenuOpen: false})
    }

    render() {
        let deploymentName = window.DEPLOYMENT_NAME;
        let beneficiaryTermPlural = window.BENEFICIARY_TERM_PLURAL;
        let beneficiaryURL = '/' + beneficiaryTermPlural.toLowerCase();

        if (!window.IS_USING_BITCOIN) {
          var tracker_link = (
            'https://' + window.ETH_CHAIN_NAME  +  (window.ETH_CHAIN_NAME? '.':'')
            + 'etherscan.io/address/' +
            (window.USING_EXTERNAL_ERC20? window.master_wallet_address : window.ETH_CONTRACT_ADDRESS))
        } else {
          tracker_link = (
            'https://www.blockchain.com/' + (window.IS_BITCOIN_TESTNET? 'btctest' : 'btc') +
            '/address/' + window.BITCOIN_MASTER_WALLET_ADDRESS
          )
        }

        if (this.props.loggedIn) {

            return (
                <div>
                  <SideBarWrapper mobileMenuOpen={this.state.mobileMenuOpen}>
                      <MediaQuery maxWidth={767}>
                          <MobileTopBar>
                              <StyledLogoLink to='/'><SVG src={this.state.iconURL}/></StyledLogoLink>
                              <Title>{this.props.email}</Title>
                              <p style={{margin: 'auto 1em', color: '#FFF'}} onClick={() => this.openMobileMenu()}>{this.state.mobileMenuOpen ? <SVG src="/static/media/close.svg"/> : <SVG src="/static/media/stack.svg"/>}</p>
                          </MobileTopBar>
                      </MediaQuery>

                      <SideBarNavigationItems>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                              <MediaQuery minWidth={768}>
                                  <StyledLogoLink to='/' onClick={() => this._closeMobileMenu()}><SVG src={this.state.iconURL}/></StyledLogoLink>
                                  <div>
                                      <p style={{color: '#fff', margin: '1em 2em 0em', fontSize: '12px', fontWeight: '600', textDecoration: 'none', letterSpacing: '1.5px', textTransform: 'uppercase'}}>{deploymentName}</p>
                                      <p style={{color: '#fff', margin: '0em 2em 1em', fontSize: '12px', textDecoration: 'none'}}>{this.props.email}</p>
                                  </div>
                              </MediaQuery>
                              <NavWrapper mobileMenuOpen={this.state.mobileMenuOpen}>
                                  <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <StyledLink to='/' exact onClick={() => this._closeMobileMenu()}>Dashboard</StyledLink>
                                    <StyledLink to='/accounts' onClick={() => this._closeMobileMenu()}>Accounts</StyledLink>
                                    <StyledLink to='/transfers' onClick={() => this._closeMobileMenu()}>Transfers</StyledLink>
                                    <StyledLink to='/settings' onClick={() => this._closeMobileMenu()}>Settings</StyledLink>
                                  </div>
                                  <ContractAddress
                                     href={tracker_link}
                                     target="_blank">
                                    { window.USING_EXTERNAL_ERC20? 'Master Wallet Tracker' : 'Contract Tracker'}
                                  </ContractAddress>
                                {/*<GetVerified to='/settings/verification'>*/}
                                  {/*Get Verified to send funds*/}
                                  {/*<SVG style={{padding: '0 1em', width: '20px', height: '20px'}} src='/static/media/right-arrow.svg'/>*/}
                                {/*</GetVerified>*/}
                              </NavWrapper>

                          </div>
                      </SideBarNavigationItems>
                  </SideBarWrapper>
                </div>
            )
        } else {
            return (
                  <div>
                  </div>
            )
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(NavBar);

const SideBarWrapper = styled.div`
  width: 234px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: #2b333b;
  -webkit-user-select: none;
  z-index: 501;
  @media (max-width: 767px) {
  display: flex;
  width: 100vw;
  flex-direction: column;
  height: ${props => props.mobileMenuOpen ? '' : '50px'};
  }
`;

const NavWrapper = styled.div`
  @media (max-width: 767px) {
  display: ${props => props.mobileMenuOpen ? '' : 'none'};
  }
`;

const Title = styled.h2`
  color: #fff;
  margin: auto 1em;
  font-size: 22px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 1.5px;
  @media (max-width: 767px) {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  line-height: 1;
  text-align: center;
  }
`;

const SideBarNavigationItems = styled.div`
  display: flex;
  flex-direction: column;
`;

const SVG = styled.img`
  width: 35px;
  padding: 1em 0 0.5em;
  display: flex;
  @media (max-width: 767px) {
  padding: 0;
  width: 30px;
  }
`;

const activeClassName = 'active-link';

const StyledLink = styled(NavLink).attrs({
  activeClassName
})`
  color: #9a9a9a;
  font-size: 12px;
  text-decoration: none;
  font-weight: 400;
  padding: 1em 2em;
  &:hover, &.${activeClassName} {
  color: #FFF;
  background-color: #3d454d;
  }
  @media (max-width: 767px) {
  font-size: 16px;
  }
`;

const MobileTopBar = styled.div`
  width: inherit;
  display: flex;
  justify-content: space-between;
  height: 50px;
`;

const StyledLogoLink = styled(NavLink)`
  color: #fff;
  margin: auto 1em;
  font-size: 22px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 1.5px;
  @media (max-width: 767px) {
  margin: auto 0.5em;
  }
`;

const ContractAddress = styled.a`
  color: #fff;
  margin: auto 2em;
  font-size: 12px;
  text-decoration: none;
  font-weight: 400;
  position: absolute;
  bottom: 1em;
  @media (max-width: 767px) {
  text-align: center;
  font-size: 16px;
  left: 0;
  right: 0;
  color: #85898c;
  }
`;

const GetVerified = styled(NavLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1em;
  width: calc(100% - 2em);
  margin: 0;
  bottom: 0;
  background-color: #475a66;
  font-weight: 600;
  color: #fff;
  font-size: 12px;
  text-decoration: none;
  position: absolute;
  @media (max-width: 767px) {
  text-align: center;
  font-size: 16px;
  left: 0;
  right: 0;
  color: #FFF;
  }
`;
import React from 'react';
import MediaQuery from 'react-responsive'
import classNames from 'classnames';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { PageWrapper } from './styledElements.js'

const mapStateToProps = (state) => {
  return {
    loggedIn: (state.login.token != null),
    message: state.message
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

class MessageBar extends React.Component {
  constructor() {
    super();
    this.state = {
        mobileMenuOpen: false,
    };
  }

  render() {
      const message = this.props.message;

      if (this.props.loggedIn) {
          return (
              <PageWrapper style={{transitionProperty: 'all', transitionDuration: '1.5s', transitionTimingFunction: 'cubic-bezier(0, 1, 0.5, 1)', top: (message.showMessage ? 0 : -35), position: 'fixed', zIndex: '99', textAlign: 'center'}}>
                  <Message style={{backgroundColor: (message.error ? '#F44336' : '#2D9EA0'), opacity: (message.showMessage ? 1 : 0)}}>{message.messageList[0]}</Message>
              </PageWrapper>
          )
      } else {
          return (
              null
          )
      }
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(MessageBar);

const Message = styled.p`
    width: calc(100% - 3em);
    margin: 1em auto;
    padding: .5em;
    font-weight: 500;
    color: white;
    box-shadow: 0px 2px 0px 0 rgba(51,51,79,.08);
    max-width: 300px;
    transition-property: all;
    transition-duration: .25s;
    transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
`;
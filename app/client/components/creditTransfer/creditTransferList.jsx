import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import ReactTable from 'react-table';

import { TopRow, StyledSelect } from '../styledElements.js';

import { modifyTransferRequest } from '../../reducers/creditTransferReducer';

import LoadingSpinner from "../loadingSpinner.jsx";
import DateTime from '../dateTime.jsx'
import AsyncButton from '../AsyncButton.jsx';
import {formatMoney} from "../../utils";
import {ModuleBox} from "../styledElements";

import { loadCreditTransferList } from "../../reducers/creditTransferReducer";

const mapStateToProps = (state) => {
  return {
    login: state.login,
    transferAccounts: state.transferAccounts,
    creditTransfers: state.creditTransfers,
    users: state.users
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    modifyTransferRequest: (body, path) => dispatch(modifyTransferRequest({body, path})),
    loadCreditTransferList: (query, path) => dispatch(loadCreditTransferList({query, path}))
  };
};

class CreditTransferList extends React.Component {
  // ---- INFO ----
  // CreditTransferList accepts;
  // credit_transfer_ids
  //    + array of credit transfer ids (only filterable by payment type)
  // or credit_transfer_list (item_list)
  //    + array of credit transfer objects
  //    + filterable and searchable via creditTransferListWithFilterWrapper
  constructor() {
	super();
	this.state = {
	  pages: null,
	  action: false,
	  user_id: null,
    transfer_type: 'ALL',
    credit_transfer_ids: {},
    allCheckedCreditTransfers: false,
    isLoading: true,
	};
	this.checkAllCreditTransfers = this.checkAllCreditTransfers.bind(this);
	this.handleChange = this.handleChange.bind(this);
	this.toggleSelectedCreditTransfer = this.toggleSelectedCreditTransfer.bind(this);
	this.onNext = this.onNext.bind(this);
  }

  componentDidMount() {
    // accepts both credit_transfer_ids and credit_transfer_list (item_list)
    let creditTransferIds = this.props.credit_transfer_ids;
    let creditTransferList = this.props.item_list;

    // handles credit transfer ids array
    if (creditTransferIds) {
      // handles checkbox initial state (true or false)
      creditTransferIds.map(i => {
        this.setState(prevState => ({
          credit_transfer_ids: {
            ...prevState.credit_transfer_ids,
            [i]: false
          },
        }));
        this.setState({isLoading: false})
      });
    }

    // handles credit transfer list array
    if (creditTransferList) {
      creditTransferList.map(i => {
        this.setState(prevState => ({
          credit_transfer_ids: {
            ...prevState.credit_transfer_ids,
            [i.id]: false
          }
        }))
      });
    }

    this.setState({isLoading: false})
  }

  componentDidUpdate(newProps) {
    let { credit_transfer_ids, item_list } = this.props;

    // handles credit_transfer_ids array
    if (credit_transfer_ids !== newProps.credit_transfer_ids) {
      this.setState({credit_transfer_ids: {}});

      credit_transfer_ids.map(i => {
        this.setState(prevState => ({
          credit_transfer_ids: {
            ...prevState.credit_transfer_ids,
            [i]: false
          },
          isLoading: false,
        }))
      })
    }

    // handles credit_transfer_list array
    if (item_list !== newProps.item_list) {

      this.setState({credit_transfer_ids: {}});

      item_list.map(i => {
        this.setState(prevState => ({
          credit_transfer_ids: {
            ...prevState.credit_transfer_ids,
            [i.id]: false
          },
          isLoading: false,
        }))
      })
    }
  }

  get_selected_ids_array(selected) {
    Object.filter = (obj, predicate) => Object.keys(obj).filter( key => predicate(obj[key]) ).reduce( (res, key) => (res[key] = obj[key], res), {} );

    return Object.keys(Object.filter(selected, selected => selected === true));
  }

  handleChange (evt) {
    this.setState({ [evt.target.name]: evt.target.value });
  }

  toggleSelectedCreditTransfer(id) {
    const value = !this.state.credit_transfer_ids[id];

    this.setState(prevState => ({
      credit_transfer_ids: {
        ...prevState.credit_transfer_ids,
        [id]: value
      },
      allChecked: false,
    }))
  }

  onNext() {
    this.get_selected_ids_array(this.state.credit_transfer_ids).map(
        id => this.props.modifyTransferRequest({action: this.state.action},id)
    );
  }

  displaySelect(id) {
    if (this.state.credit_transfer_ids[id] !== null) {
      return(
        <input name={id} type="checkbox" checked={this.state.credit_transfer_ids[id]} onChange={() => this.toggleSelectedCreditTransfer(id)} />
      )
    }
  }

  checkAllCreditTransfers(filteredData) {
    if (this.state.allCheckedCreditTransfers) {
      // UNCHECK
      var value = false
    } else {
      // CHECK ALL
      value = true
    }

    filteredData.map(i => {
      this.setState(prevState => ({
        credit_transfer_ids: {
          ...prevState.credit_transfer_ids,
          [i.id]: value
        },
        allCheckedCreditTransfers: value,
      }))
    })
  };

  _customSender(creditTransfer) {
    if (this.props.login.adminTier === 'view') {
      return creditTransfer.sender_blockchain_address
    }
    let sender = this.props.users.byId[creditTransfer.sender_user];
    if (sender !== null && typeof sender !== "undefined") {
      return sender.first_name + ' ' + sender.last_name;
    } else {
      return null
    }
  }

  _customRecipient(creditTransfer) {
    if (this.props.login.adminTier  === 'view') {
      return creditTransfer.recipient_blockchain_address
    }
    let recipient = this.props.users.byId[creditTransfer.recipient_user];
    if (recipient !== null && typeof recipient !== "undefined") {
      return recipient.first_name + ' ' + recipient.last_name;
    } else {
      return null
    }
  }

  render() {
    // todo -- add new transfer function
    const { creditTransfers } = this.props;


	  const loadingStatus = creditTransfers.loadStatus.isRequesting;

    let creditTransferList = Object.keys(this.state.credit_transfer_ids)
    .filter(id => typeof(this.props.creditTransfers.byId[id]) !== "undefined")
    .map(id => {
      var item = this.props.creditTransfers.byId[id];
      if (item.sender_user) {
        item.sender = (
          this.props.users.byId[item.sender_user].first_name
          + ' ' +
          this.props.users.byId[item.sender_user].last_name
        )
      } else if (item.transfer_type === 'DISBURSEMENT' && item.authorising_user_email) {
        item.sender = <div style={{color: '#96DADC'}}> {item.authorising_user_email} </div>
      } else {
        item.sender = '-'
      }

      if (item.recipient_user) {
        item.recipient = (
          this.props.users.byId[item.recipient_user].first_name
          + ' ' +
          this.props.users.byId[item.recipient_user].last_name
        )
      } else if (item.transfer_type === 'WITHDRAWAL' && item.authorising_user_email) {
        item.recipient = <div style={{color: '#96DADC'}}> {item.authorising_user_email} </div>
      } else {
        item.recipient = '-'
      }
      return (item)
    })
    // .map(id => this.props.creditTransfers.byId[id])
    .sort((a, b) => (b.id - a.id));


	  let rowValues = Object.values(this.state.credit_transfer_ids);
	  let numberSelected = typeof(rowValues) !== "undefined" ? rowValues.filter(Boolean).length : null;
	  let isSelected = numberSelected > 0;

	  let showNext = numberSelected === 0 || this.props.action === "select";

	  if (this.state.transfer_type !== 'ALL') {
	    var filteredData = creditTransferList.filter(creditTransfer => creditTransfer.transfer_type === this.state.transfer_type)
      console.log('filteredData',filteredData)
	  } else {
	    filteredData = creditTransferList
	  }

	  if (isSelected) {
	    var topBarContent =
        <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
          <p style={{margin: '1em'}}>{numberSelected} selected</p>
          {this.props.login.adminTier !== 'view' ?
          <div style={{margin: '1em'}}>
            <AsyncButton onClick={this.onNext} miniSpinnerStyle={{height: '10px', width: '10px'}} buttonStyle={{display: (showNext ? 'none' : 'inline-flex'), fontWeight: '400', margin: '0em 1em', lineHeight: '25px', height: '25px'}} isLoading={this.props.isApproving} buttonText="NEXT"/>
            <StyledSelect style={{fontWeight: '400', margin: '0', lineHeight: '25px', height: '25px'}} name="action" defaultValue="select" onChange={this.handleChange}>
              <option name="action" disabled value="select">-- SELECT --</option>
              <option name="action" value="COMPLETE">COMPLETE</option>
              <option name="action" value="REJECT">REJECT</option>
            </StyledSelect>
          </div> : null}

        </div>

      } else {
	    topBarContent =
        <StyledSelect style={{fontWeight: '400', margin: '1em', lineHeight: '25px', height: '25px'}} name="transfer_type" value={this.props.transfer_type} onChange={this.handleChange}>
          <option name="transfer_type" value="ALL">ALL TRANSFERS</option>
          <option name="transfer_type" value="PAYMENT">PAYMENTS</option>
          <option name="transfer_type" value="DISBURSEMENT">DISBURSEMENTS</option>
          <option name="transfer_type" value="WITHDRAWAL">WITHDRAWALS</option>
        </StyledSelect>
      }

      if (this.props.creditTransfers.loadStatus.isRequesting || this.props.transferAccounts.loadStatus.isRequesting) {
        return (
          <div style={{display: 'flex', justifyContent: 'center', margin: '1em'}}>
            <LoadingSpinner/>
          </div>
        )
      }

	  if (this.props.creditTransfers.loadStatus.success || this.props.transferAccounts.loadStatus.success && !this.state.isLoading) {
	    const tableLength = typeof(filteredData) !== "undefined" ? filteredData.length : null;
		  return (
			  <Wrapper>
          <ModuleBox style={{width: 'calc(100% - 2em)'}}>
          <TopRow>
            {topBarContent}
          </TopRow>
				  <ReactTable
            columns={[
              {
					      Header: "ID",
                accessor: "id",
                headerClassName: 'react-table-header',
                width: 60,
              },
              {
					      Header: "Type",
                accessor: "transfer_type",
                headerClassName: 'react-table-header',
                className: 'react-table-first-cell',
              },
              {
                Header: "Created",
                accessor: "created",
                headerClassName: 'react-table-header',
                Cell: cellInfo => (<DateTime created={cellInfo.value}/>)
              },
              {
                Header: "Amount",
                accessor: "transfer_amount",
                headerClassName: 'react-table-header',
                Cell: cellInfo => (<p style={{margin: 0}}>{formatMoney(cellInfo.value / 100)}</p>),
              },
						  {
						    Header: "Sender",
                id: 'senderUser',
                accessor: creditTransfer => this._customSender(creditTransfer),
                headerClassName: 'react-table-header',
              },
              {
						    Header: "Recipient",
                id: 'recipientUser',
                accessor: creditTransfer => this._customRecipient(creditTransfer),
                headerClassName: 'react-table-header',
              },
              {
						    Header: "Approval",
                accessor: "transfer_status",
                headerClassName: 'react-table-header',
                Cell: cellInfo => {
                  if (cellInfo.value === 'COMPLETE') {
                    var colour = '#9BDF56'
                  } else if (cellInfo.value === 'PENDING') {
                    colour = '#F5A623'
                  } else if (cellInfo.value === 'REJECTED') {
                    colour = '#F16853'
                  } else {
                    colour = '#c6c6c6'
                  }
                  return (
                    <div style={{height: '100%', display: 'flex', alignItems: 'center'}}>
                      <Status style={{backgroundColor: colour}}>
                        {cellInfo.value}
                      </Status>
                    </div>
                  )
                },
              },
              {
                Header: "Blockchain",
                id: "blockchain_status",
                accessor: creditTransfer => {
                  console.log(creditTransfer)
                  try {
                    var task = creditTransfer.blockchain_status_breakdown.transfer || creditTransfer.blockchain_status_breakdown.disbursement;
                  } catch (e) {
                    task = {}
                  }
                  return {
                    'status': creditTransfer.blockchain_status,
                    'hash': task.hash
                    }
                },
                headerClassName: 'react-table-header',
                Cell: cellInfo => {
                  let {status, hash} = cellInfo.value;

                  if (status === 'COMPLETE') {
                    var colour = '#9BDF56'
                  } else if (status === 'PENDING') {
                    colour = '#F5A623'
                  } else if (status === 'ERROR') {
                    colour = '#F16853'
                  } else {
                    colour = '#c6c6c6'
                  }

                  if (hash) {
                    if (!window.IS_USING_BITCOIN) {
                      var tracker_link = (
                        'https://' + window.ETH_CHAIN_NAME  +  (window.ETH_CHAIN_NAME? '.':'')
                        + 'etherscan.io/tx/' + hash
                      )
                    } else {
                      tracker_link = (
                        'https://www.blockchain.com/' + (window.IS_BITCOIN_TESTNET? 'btctest' : 'btc') +
                        '/tx/' + hash
                      )
                    }
                  } else {
                    tracker_link = null
                  }
                  return (
                    <div style={{height: '100%', display: 'flex', alignItems: 'center'}}>
                      <Status style={{backgroundColor: colour}} href={tracker_link} target="_blank">
                        {status}
                      </Status>
                    </div>
                  )
                },
              },
              {
                Header: () => (<input type="checkbox" checked={this.state.allCheckedCreditTransfers} onChange={() => this.checkAllCreditTransfers(filteredData)}/>),
                accessor: "id",
                headerClassName: 'react-table-header',
                width: 60,
                sortable: false,
                Cell: cellInfo => this.displaySelect(cellInfo.value)
              },
            ]}
					  data={filteredData}
					  loading={loadingStatus} // Display the loading overlay when we need it
					  pageSize={tableLength}
					  sortable={true}
					  showPagination={false}
					  showPageSizeOptions={false}
					  className='react-table'
					  resizable={false}
            getTdProps={(state, rowInfo) => {
              return {
                onClick: (e, handleOriginal) => {
                  this.toggleSelectedCreditTransfer(rowInfo.row.id);
                  if (handleOriginal) {
                    handleOriginal();
                  }
                }
              };
            }}
          />
          <FooterBar>
            <p style={{margin: 0}}>{tableLength} transfers</p>
            <div style={{margin: 0, marginLeft: 10}} onClick={() =>
              this.props.loadCreditTransferList({per_page:50, page: Math.floor(tableLength/50 + 1)})}>
              (Get More)
            </div>
          </FooterBar>
          </ModuleBox>
        </Wrapper>
      );
      } else if (this.props.transferAccounts.loadStatus.error !== null) {
	    return(
	      <p>{this.props.transferAccounts.loadStatus.error}</p>
      )
      } else {
	    return (
	      <p style={{padding: '1em', textAlign: 'center'}}>No credit transfers found</p>
      )
      }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreditTransferList);

const FooterBar = styled.div`
    display: flex;
    border-top: solid 1px rgba(0,0,0,0.05);
    padding: 1em;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Status = styled.a`
    color: #FFF;
    padding: 0.2em 1em;
    margin: 0;
    font-weight: 500;
    border-radius: 20px;
    text-transform: uppercase;
    font-size: 12px;
    width: 90px;
    text-align: center;
  `;
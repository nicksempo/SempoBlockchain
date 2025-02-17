import os, configparser, boto3, hashlib
from bit import PrivateKeyTestnet, PrivateKey
from botocore.exceptions import EndpointConnectionError
from ethereum import utils
from web3 import Web3

CONFIG_DIR = os.path.abspath(os.path.dirname(__file__))

# ENV_DEPLOYMENT_NAME: dev, 'acmecorp-prod' etc
ENV_DEPLOYMENT_NAME = os.environ.get('DEPLOYMENT_NAME') or 'local'

# DEPLOYMENT_LOCATION: should be 'local' or 'aws' 
DEPLOYMENT_LOCATION = os.environ.get('LOCATION') or 'LOCAL'

BUILD_HASH = os.environ.get('GIT_HASH') or 'null'

print('ENV_DEPLOYMENT_NAME: ' + ENV_DEPLOYMENT_NAME)
print('at DEPLOYMENT_LOCATION: ' + DEPLOYMENT_LOCATION)
print('with BUILD_HASH: ' + BUILD_HASH)

CONFIG_FILENAME = "{}_config.ini".format(ENV_DEPLOYMENT_NAME.lower())

common_parser = configparser.ConfigParser()
specific_parser = configparser.ConfigParser()

if DEPLOYMENT_LOCATION == "PROD" or os.environ.get('AWS_ACCESS_KEY_ID'):
    print("Key len is {}".format(len(os.environ.get('AWS_ACCESS_KEY_ID'))))
    if os.environ.get('AWS_ACCESS_KEY_ID'):
        if not os.environ.get('AWS_SECRET_ACCESS_KEY'):
            raise Exception("Missing AWS_SECRET_ACCESS_KEY")
        session = boto3.Session(
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
        )
    else:
        session = boto3.Session()

    client = session.client('s3')

    SECRET_BUCKET = "ctp-prod-secrets"
    FORCE_SSL = True

    specific_obj = client.get_object(Bucket=SECRET_BUCKET, Key=CONFIG_FILENAME)
    specific_read_result = specific_obj['Body'].read().decode('utf-8')
    specific_parser.read_string(specific_read_result)

    common_obj = client.get_object(Bucket=SECRET_BUCKET, Key='common_config.ini')
    common_read_result = common_obj['Body'].read().decode('utf-8')
    common_parser.read_string(common_read_result)

else:
    if not (os.path.isfile('config_files/common_config.ini')
            and os.path.isfile('config_files/' + CONFIG_FILENAME)):
        raise Exception("Missing Config Files")

    common_parser.read(os.path.join(CONFIG_DIR, 'config_files/common_config.ini'))
    specific_parser.read(os.path.join(CONFIG_DIR, 'config_files/' + CONFIG_FILENAME))

DEPLOYMENT_NAME     = specific_parser['APP']['DEPLOYMENT_NAME']

# Check that the deployment name specified by the env matches the one in the config file
if ENV_DEPLOYMENT_NAME.lower() != DEPLOYMENT_NAME.lower():
    print('deployment name in env ({}) does not match that in config ({}), aborting'.format(ENV_DEPLOYMENT_NAME.lower(),
                                                                                            DEPLOYMENT_NAME.lower()))
    raise RuntimeError

PROGRAM_NAME        = specific_parser['APP']['PROGRAM_NAME']
CURRENCY_NAME       = specific_parser['APP']['CURRENCY_NAME']
CURRENCY_DECIMALS   = int(specific_parser['APP']['CURRENCY_DECIMALS'])
STARTING_BALANCE    = int(specific_parser['APP']['STARTING_BALANCE'])
DEFAULT_COUNTRY     = specific_parser['APP']['DEFAULT_COUNTRY']
DEFAULT_LAT         = float(specific_parser['APP']['DEFAULT_LAT'])
DEFAULT_LNG         = float(specific_parser['APP']['DEFAULT_LNG'])
BENEFICIARY_TERM    = specific_parser['APP']['BENEFICIARY_TERM']
BENEFICIARY_TERM_PLURAL = specific_parser['APP']['BENEFICIARY_TERM_PLURAL']
CHATBOT_REQUIRE_PIN = specific_parser['APP'].getboolean('CHATBOT_REQUIRE_PIN')
DEFAULT_FEEDBACK_QUESTIONS = list(specific_parser['APP']['DEFAULT_FEEDBACK_QUESTIONS'].split(','))
FEEDBACK_TRIGGERED_WHEN_BALANCE_BELOW = int(specific_parser['APP']['FEEDBACK_TRIGGERED_WHEN_BALANCE_BELOW'])
FEEDBACK_TRIGGERED_WHEN_TRANSFER_COUNT_ABOVE = int(specific_parser['APP']['FEEDBACK_TRIGGERED_WHEN_TRANSFER_COUNT_ABOVE'])
REQUIRE_TARGETING_SURVEY = specific_parser['APP'].getboolean('REQUIRE_TARGETING_SURVEY')

CASHOUT_INCENTIVE_PERCENT = float(specific_parser['APP'].get('CASHOUT_INCENTIVE_PERCENT', 0))
AUTO_APPROVE_TRANSFER_ACCOUNTS = specific_parser['APP'].getboolean('AUTO_APPROVE_TRANSFER_ACCOUNTS', False)
MAXIMUM_CUSTOM_INITIAL_DISBURSEMENT = int(specific_parser['APP'].get('MAXIMUM_CUSTOM_INITIAL_DISBURSEMENT', 0))
ONBOARDING_SMS = specific_parser['APP'].getboolean('ONBOARDING_SMS', False)
TFA_REQUIRED_ROLES = specific_parser['APP']['TFA_REQUIRED_ROLES'].split(',')
MOBILE_VERSION = specific_parser['APP']['MOBILE_VERSION']

SECRET_KEY          = specific_parser['APP']['SECRET_KEY'] + DEPLOYMENT_NAME
ECDSA_SECRET        = hashlib.sha256(specific_parser['APP']['ECDSA_SECRET'].encode()).digest()[0:24]
APP_HOST            = specific_parser['APP']['APP_HOST']

TOKEN_EXPIRATION =  60 * 60 * 24 * 1 # Day

BASIC_AUTH_USERNAME = common_parser['APP']['BASIC_AUTH_USERNAME'] + '_' + DEPLOYMENT_NAME
BASIC_AUTH_PASSWORD= common_parser['APP']['BASIC_AUTH_PASSWORD']

KOBO_AUTH_USERNAME = 'kobo_' + DEPLOYMENT_NAME
KOBO_AUTH_PASSWORD = hashlib.sha256(SECRET_KEY.encode()).hexdigest()[0:8]

BASIC_AUTH_CREDENTIALS = {
    BASIC_AUTH_USERNAME: BASIC_AUTH_PASSWORD,
    KOBO_AUTH_USERNAME: KOBO_AUTH_PASSWORD
}

REDIS_URL = 'redis://' + specific_parser['REDIS']['URI']

DATABASE_USER = specific_parser['DATABASE'].get('user') \
                or '{}_{}'.format(common_parser['DATABASE']['user'],DEPLOYMENT_NAME.replace("-", "_"))

DATABASE_NAME = specific_parser['DATABASE'].get('database') \
                or common_parser['DATABASE']['database']

SQLALCHEMY_DATABASE_URI = 'postgresql://{}:{}@{}:{}/{}'.format(DATABASE_USER,
                                                               specific_parser['DATABASE']['password'],
                                                               specific_parser['DATABASE']['host'],
                                                               common_parser['DATABASE']['port'],
                                                               DATABASE_NAME)

CENSORED_URI            = 'postgresql://{}:*******@{}:{}/{}'.format(DATABASE_USER,
                                                                    specific_parser['DATABASE']['host'],
                                                                    common_parser['DATABASE']['port'],
                                                                    DATABASE_NAME)

print('Loading database URI: ' + CENSORED_URI)

SQLALCHEMY_TRACK_MODIFICATIONS = False

AWS_SES_KEY_ID = common_parser['AWS']['ses_key_id']
AWS_SES_SECRET = common_parser['AWS']['ses_secret']

if DEPLOYMENT_LOCATION == "PROD":
    SENTRY_SERVER_DSN = common_parser['SENTRY']['server_dsn']
    SENTRY_REACT_DSN = common_parser['SENTRY']['react_dsn']
else:
    SENTRY_SERVER_DSN = ''
    SENTRY_REACT_DSN = ''


GOOGLE_GEOCODE_KEY = common_parser['GOOGLE']['geocode_key']
CHROMEDRIVER_LOCATION = specific_parser['GOOGLE']['chromedriver_location']
GOOGLE_ANALYTICS_ID = common_parser['GOOGLE']['google_analytics_id']

HEAP_ANALYTICS_ID = specific_parser['HEAP']['id']

MAPBOX_TOKEN = common_parser['MAPBOX']['token']

PUSHER_APP_ID   = common_parser['PUSHER']['app_id']
PUSHER_KEY      = common_parser['PUSHER']['key']
PUSHER_SECRET   = common_parser['PUSHER']['secret']
PUSHER_CLUSTER  = common_parser['PUSHER']['cluser']
PUSHER_ENV_CHANNEL = common_parser['PUSHER']['environment_channel'] + '-' + DEPLOYMENT_NAME + '-' + DEPLOYMENT_LOCATION
PUSHER_SUPERADMIN_ENV_CHANNEL = common_parser['PUSHER']['superadmin_environment_channel'] + '-' + DEPLOYMENT_NAME + '-' + DEPLOYMENT_LOCATION

TWILIO_SID   = common_parser['TWILIO']['sid']
TWILIO_TOKEN = common_parser['TWILIO']['token']
TWILIO_PHONE = specific_parser['TWILIO']['phone']

MESSAGEBIRD_KEY = specific_parser['MESSAGEBIRD']['key']
MESSAGEBIRD_PHONE = specific_parser['MESSAGEBIRD']['phone']

try:
    from ecdsa import SigningKey, NIST192p
    ECDSA_SIGNING_KEY = SigningKey.from_string(ECDSA_SECRET, curve=NIST192p)
    ECDSA_PUBLIC = '04' + ECDSA_SIGNING_KEY.get_verifying_key().to_string().hex()
except ImportError:
    pass

# https://ropsten.infura.io/9CAC3Lb5OjaoecQIpPNP
# https://kovan.infura.io/9CAC3Lb5OjaoecQIpPNP

ETH_HTTP_PROVIDER       = specific_parser['ETHEREUM']['http_provider']
ETH_WEBSOCKET_PROVIDER  = specific_parser['ETHEREUM'].get('websocket_provider')
ETH_CHAIN_ID            = specific_parser['ETHEREUM']['chain_id'] or 1
ETH_CHAIN_NAME          = {1: '', 3: 'Ropsten', 42: 'Kovan'}.get(int(ETH_CHAIN_ID), '')
ETH_OWNER_ADDRESS       = specific_parser['ETHEREUM']['owner_address']
ETH_OWNER_PRIVATE_KEY   = specific_parser['ETHEREUM']['owner_private_key']
ETH_CONTRACT_VERSION    = specific_parser['ETHEREUM']['contract_version']
ETH_GAS_PRICE           = int(specific_parser['ETHEREUM']['gas_price_gwei'] or 0)
ETH_GAS_LIMIT           = int(specific_parser['ETHEREUM']['gas_limit'] or 0)
ETH_TARGET_TRANSACTION_TIME = int(specific_parser['ETHEREUM']['target_transaction_time'] or 120)
ETH_GAS_PRICE_PROVIDER  = specific_parser['ETHEREUM']['gas_price_provider']
ETH_CONTRACT_NAME       = 'SempoCredit_{}_{}_v{}'.format(DEPLOYMENT_NAME,DEPLOYMENT_LOCATION,str(ETH_CONTRACT_VERSION))

ETH_CHECK_TRANSACTION_BASE_TIME = 20
ETH_CHECK_TRANSACTION_RETRIES = int(specific_parser['ETHEREUM']['check_transaction_retries'])
ETH_CHECK_TRANSACTION_RETRIES_TIME_LIMIT = sum(
    [ETH_CHECK_TRANSACTION_BASE_TIME * 2 ** i for i in range(1,ETH_CHECK_TRANSACTION_RETRIES + 1)]
)

INTERNAL_TO_TOKEN_RATIO = float(specific_parser['ETHEREUM'].get('internal_to_token_ratio', 1))
FORCE_ETH_DISBURSEMENT_AMOUNT = float(specific_parser['ETHEREUM'].get('force_eth_disbursement_amount', 0))

unchecksummed_withdraw_to_address     = specific_parser['ETHEREUM'].get('withdraw_to_address')
if unchecksummed_withdraw_to_address:
    WITHDRAW_TO_ADDRESS = Web3.toChecksumAddress(unchecksummed_withdraw_to_address)
else:
    WITHDRAW_TO_ADDRESS = None

master_wallet_private_key = utils.sha3(SECRET_KEY + DEPLOYMENT_NAME)
MASTER_WALLET_PRIVATE_KEY = master_wallet_private_key.hex()
MASTER_WALLET_ADDRESS = Web3.toChecksumAddress(utils.privtoaddr(master_wallet_private_key))

ETH_CONTRACT_TYPE       = specific_parser['ETHEREUM'].get('contract_type', 'standard').lower()
ETH_CONTRACT_ADDRESS    = specific_parser['ETHEREUM'].get('contract_address')
USING_EXTERNAL_ERC20    = ETH_CONTRACT_TYPE != 'mintable'

if specific_parser['ETHEREUM'].get('dai_contract_address'):
    # support of old config file syntax
    ETH_CONTRACT_ADDRESS = specific_parser['ETHEREUM'].get('dai_contract_address')

IS_USING_BITCOIN        = specific_parser['BITCOIN'].getboolean('is_using_bitcoin') or False
IS_BITCOIN_TESTNET      = specific_parser['BITCOIN'].getboolean('is_testnet') or False
BITCOIN_MASTER_WALLET_WIF       = specific_parser['BITCOIN'].get('master_wallet_wif')
KeyGenerator = PrivateKeyTestnet if IS_BITCOIN_TESTNET else PrivateKey
if IS_USING_BITCOIN:
    BITCOIN_MASTER_WALLET_ADDRESS = KeyGenerator(BITCOIN_MASTER_WALLET_WIF).address
BITCOIN_CHECK_TRANSACTION_BASE_TIME = 360
BITCOIN_CHECK_TRANSACTION_RETRIES = 8

FACEBOOK_TOKEN = common_parser['FACEBOOK']['token']
FACEBOOK_VERIFY_TOKEN = common_parser['FACEBOOK']['verify_token']

AP_IS_ACTIVE             = specific_parser['ASSEMBLYPAYMENTS'].getboolean('ap_is_active')
ASSEMBLYPAYMENTS_HOST = specific_parser['ASSEMBLYPAYMENTS']['host']
ASSEMBLYPAYMENTS_EMAIL = common_parser['ASSEMBLYPAYMENTS']['email']
ASSEMBLYPAYMENTS_KEY = common_parser['ASSEMBLYPAYMENTS']['key']

WYRE_PUBLIC_KEY = common_parser['WYRE']['public_key']
WYRE_SECRET_KEY = common_parser['WYRE']['secret_key']
WYRE_HOST = specific_parser['WYRE']['host']
WYRE_HOST_V2 = specific_parser['WYRE']['host_v2']

IPIFY_API_KEY = common_parser['IPIFY']['api_key']

INTERCOM_ANDROID_SECRET = common_parser['INTERCOM']['android_secret']

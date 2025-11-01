import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Parser from 'html-react-parser';
import classNames from 'classnames/bind';
import styles from './autoRefreshButton.scss';
import RefreshIcon from 'common/img/refresh-icon-inline.svg';


const cx = classNames.bind(styles);

export class AutoRefreshButton extends Component {
  static propTypes = {
    onRefresh: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    interval: PropTypes.number,
    className: PropTypes.string,
    title: PropTypes.string,
    autoStart: PropTypes.bool,
    onAutoRefreshToggle: PropTypes.func,
  };

  static defaultProps = {
    disabled: false,
    interval: 3000,
    className: '',
    title: '',
    autoStart: false,
    onAutoRefreshToggle: () => {},
  };

  state = {
    isAutoRefreshing: false,
    countdown: 0,
  };

  intervalId = null;
  countdownId = null;
  mounted = false;

  componentDidMount() {
    this.mounted = true;
    if (this.props.autoStart) {
      this.startAutoRefresh();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.disabled !== this.props.disabled && this.props.disabled) {
      this.stopAutoRefresh();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.stopAutoRefresh();
    this.stopCountdown();
  }

  startAutoRefresh = () => {
    if (this.intervalId || !this.mounted) return;

    const intervalMs = this.props.interval;

    this.setState({
      isAutoRefreshing: true,
      countdown: Math.ceil(intervalMs / 1000)
    });

    this.startCountdown();

    this.intervalId = setInterval(() => {
      if (!this.mounted) {
        this.stopAutoRefresh();
        return;
      }

      if (!this.props.disabled) {
        try {
          this.props.onRefresh();
          if (this.mounted) {
            this.startCountdown();
          }
        } catch (error) {
          console.error('Auto-refresh error:', error);
          this.stopAutoRefresh();
        }
      }
    }, intervalMs);

    this.props.onAutoRefreshToggle(true);
  };

  stopAutoRefresh = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.stopCountdown();

    if (this.mounted) {
      this.setState({
        isAutoRefreshing: false,
        countdown: 0
      });
    }
    this.props.onAutoRefreshToggle(false);
  };

  startCountdown = () => {
    this.stopCountdown();

    const intervalMs = this.props.interval;
    let countdown = Math.ceil(intervalMs / 1000);

    if (this.mounted) {
      this.setState({ countdown });
    }

    this.countdownId = setInterval(() => {
      countdown -= 1;
      if (this.mounted) {
        this.setState({ countdown });
      }

      if (countdown <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  };

  stopCountdown = () => {
    if (this.countdownId) {
      clearInterval(this.countdownId);
      this.countdownId = null;
    }
  };

  toggleAutoRefresh = () => {
    if (this.state.isAutoRefreshing) {
      this.stopAutoRefresh();
    } else {
      this.startAutoRefresh();
    }
  };

  render() {
    const {
      disabled,
      className,
      title
    } = this.props;
    const { isAutoRefreshing, countdown } = this.state;

    const buttonTitle = title || (isAutoRefreshing
      ? `Auto-refresh active, next in ${countdown}s`
      : 'Start auto-refresh');

    const buttonText = isAutoRefreshing ? `Auto Refresh ${countdown}s` : 'Auto Refresh';

    return (
      <button
        type="button"
        className={cx('auto-refresh-button', className, {
          'auto-refreshing': isAutoRefreshing,
          'disabled': disabled,
        })}
        onClick={this.toggleAutoRefresh}
        disabled={disabled}
        title={buttonTitle}
      >
        <i className={cx('icon', { 'spinning': isAutoRefreshing })}>
          {Parser(RefreshIcon)}
        </i>
        <span className={cx('text')}>{buttonText}</span>
      </button>
    );
  }
}

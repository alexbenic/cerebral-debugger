import './styles.css'
import { Component } from 'inferno'
import { connect } from '@cerebral/inferno'
import { state, signal } from 'cerebral/tags'
import { nameToColors } from '../../../../common/utils'
import classnames from 'classnames'
import signalsList from '../../../../common/computed/signalsList'

export default connect(
  {
    type: state`type`,
    signalsList: signalsList,
    isExecuting: state`isExecuting`,
    executedBySignals: state`executedBySignals`,
    searchValue: state`searchValue`,
    expandedSignalGroups: state`expandedSignalGroups`,
    showFullPathNames: state`storage.showFullPathNames`,
    currentSignalExecutionId: state`currentSignalExecutionId`,
    signalClicked: signal`signalClicked`,
  },
  class SignalsList extends Component {
    onSignalClick(event, signal, index) {
      this.props.signalClicked({
        executionId: signal.executionId,
        groupId: signal.groupId,
      })
    }
    hasSearchContent(signal) {
      return Object.keys(signal.functionsRun).reduce(
        (hasSearchContent, key) => {
          const data = signal.functionsRun[key].data

          if (hasSearchContent) {
            return hasSearchContent
          }

          return (data || []).reduce((currentHasSearchContent, dataItem) => {
            if (currentHasSearchContent) {
              return currentHasSearchContent
            }

            if (
              dataItem.type === 'mutation' &&
              dataItem.args[0].join('.').indexOf(this.props.searchValue) >= 0
            ) {
              return true
            }

            return false
          }, hasSearchContent)
        },
        false
      )
    }
    renderSignal(signal, index) {
      const prevSignal = this.props.signalsList[index - 1]
      const currentSignalExecutionId = this.props.currentSignalExecutionId
      const namePath = signal.name.split('.')
      const name = namePath.pop()
      const colors = nameToColors(signal.name, name)
      const hex = colors.backgroundColor
      const signalStyle = {
        backgroundColor: hex,
      }
      const isActive = currentSignalExecutionId === signal.executionId
      const hasSearchContent =
        this.props.searchValue && this.hasSearchContent(signal)
      const isExecuting =
        signal.isExecuting ||
        (signal.executedIds || []).reduce((isSubExecuting, executedId) => {
          if (isSubExecuting) {
            return true
          }

          return this.props.executedBySignals[executedId].isExecuting
        }, false)
      const hasError =
        signal.hasError ||
        (signal.executedIds || []).reduce((hasSubError, executedId) => {
          if (hasSubError) {
            return true
          }

          return this.props.executedBySignals[executedId].hasError
        }, false)

      const isInOpenGroup =
        this.props.expandedSignalGroups.indexOf(signal.groupId) !== -1
      if (
        prevSignal &&
        prevSignal.groupId === signal.groupId &&
        !isInOpenGroup
      ) {
        return null
      }
      let groupCount = 1
      for (let x = index + 1; x < this.props.signalsList.length - 1; x++) {
        if (this.props.signalsList[x].groupId === signal.groupId) {
          groupCount++
        } else {
          break
        }
      }
      const isGrouped =
        (!prevSignal || prevSignal.groupId !== signal.groupId) && groupCount > 1

      const className = classnames({
        'list-item': true,
        'list-activeItem': isActive,
        'list-grouped': signal.isGrouped,
        'list-item-error': hasError,
        'list-item-grouped': isGrouped,
        pulse: isExecuting,
      })

      const indicatorClassname = classnames('list-indicator', {
        'list-fadedItem': hasSearchContent === false,
      })

      return (
        <li
          onClick={event => this.onSignalClick(event, signal, index)}
          className={className}
          key={index}
        >
          {isInOpenGroup &&
          prevSignal &&
          prevSignal.groupId === signal.groupId ? null : (
            <div className={indicatorClassname} style={signalStyle} />
          )}
          <div className="list-groupCount">
            {isGrouped ? ` (${groupCount})` : null}
          </div>
          <span className="list-name">
            {this.props.showFullPathNames ? signal.name : name}
            {this.props.type === 'cft' && signal.source === 'ft' ? (
              <small className="ft-indication">FT</small>
            ) : null}
          </span>
        </li>
      )
    }
    render() {
      const signals = this.props.signalsList

      return (
        <ul className="list">
          {signals.map((signal, index) => this.renderSignal(signal, index))}
        </ul>
      )
    }
  }
)

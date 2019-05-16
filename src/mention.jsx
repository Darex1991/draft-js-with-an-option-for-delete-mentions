import React, { Component } from 'react';
import {
  convertFromRaw,
  EditorState,
  Modifier,
  SelectionState,
} from 'draft-js';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import Editor from 'draft-js-plugins-editor';
import getRangesForDraftEntity from 'draft-js/lib/getRangesForDraftEntity';
import _ from 'lodash';

import mentions from './mentions';
import initialValue from './initialValue.json';

import './editorStyles.css';
import './mentionsStyles.css';
import './button.css';

const positionSuggestions = ({ state, props }) => {
  let transform;
  let transition;

  if (state.isActive && props.suggestions.length > 0) {
    transform = 'scaleY(1)';
    transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)';
  } else if (state.isActive) {
    transform = 'scaleY(0)';
    transition = 'all 0.25s cubic-bezier(.3,1,.2,1)';
  }

  return {
    transform,
    transition,
  };
};

const Entry = props => {
  const {
    mention,
    theme,
    searchValue, // eslint-disable-line no-unused-vars
    isFocused, // eslint-disable-line no-unused-vars
    ...parentProps
  } = props;
  return (
    <div {...parentProps}>
      <div className="mentionSuggestionsEntryContainer">
        <div className="mentionSuggestionsEntryContainerRight">
          <div className="mentionSuggestionsEntryText">{mention.name}</div>
        </div>
      </div>
    </div>
  );
};

export default class CustomMentionEditor extends Component {
  constructor(props) {
    super(props);
    this.mentionPlugin = createMentionPlugin({
      mentions,
      entityMutability: 'IMMUTABLE',
      theme: {
        mention: 'mention',
        mentionSuggestions: 'mentionSuggestions',
        mentionSuggestionsEntry: 'mentionSuggestionsEntry',
        mentionSuggestionsEntryText: 'mentionSuggestionsEntryText',
        mentionSuggestionsEntryFocused: 'mentionSuggestionsEntryFocused',
        mentionSuggestionsEntryAvatar: 'mentionSuggestionsEntryAvatar',
      },
      positionSuggestions,
      mentionPrefix: '',
      mentionTrigger: '@',
      supportWhitespace: false,
      mentionComponent: (mentionProps) => {
        return (
          <span
            className={`${mentionProps.className} mention-button`}
          >
            {mentionProps.children}
            <button onClick={event => this.delete(event, mentionProps)}>X</button>
          </span>
        );
      },
    });

    this.state = {
      editorState: EditorState.createWithContent(convertFromRaw(initialValue)),
      suggestions: mentions,
    };

    this.delete = this.delete.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.focus = this.focus.bind(this);

    this.editor = React.createRef();
  }

  delete(event, mentionProps) {
    _.invoke(event, 'stopPropagation');

    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const block = _.get(mentionProps, ['children', 0, 'props', 'block']);
    const blockKey = block.getKey();
    const getBlock = getRangesForDraftEntity(block, mentionProps.entityKey);

    const entitySelection = new SelectionState({
      anchorKey: blockKey,
      anchorOffset: getBlock.start,
      focusKey: blockKey,
      focusOffset: getBlock.end,
      hasFocus: true,
      isBackward: false,
    });

    const setEntityPositionFromClickedButton = entitySelection.merge({
      anchorOffset: _.get(_.first(getBlock), 'start'),
      focusOffset: _.get(_.first(getBlock), 'end'),
    });

    const textWithoutRange = Modifier.removeRange(contentState, setEntityPositionFromClickedButton, 'backward');
    const newEditorState = EditorState.push(editorState, textWithoutRange, 'remove-range');
    this.onChange(newEditorState)
  };

  onChange(editorState) {
    this.setState({
      editorState,
    });
  };

  onSearchChange({ value }) {
    const suggestions = defaultSuggestionsFilter(value, mentions);

    this.setState({
      suggestions,
    });
  };

  focus() {
    this.editor.focus();
  };

  render() {
    const { rows, cols } = this.props;
    const { MentionSuggestions } = this.mentionPlugin;
    const plugins = [this.mentionPlugin];

    return (
      <div>
        <h1>Hover mention for delete token</h1>
        <div className="editor" onClick={this.focus}>
          <Editor
            className="textarea__field"
            cols={cols}
            editorState={this.state.editorState}
            onChange={this.onChange}
            plugins={plugins}
            ref={this.editor}
            rows={rows}
          />
          <MentionSuggestions
            onSearchChange={this.onSearchChange}
            suggestions={this.state.suggestions}
            entryComponent={Entry}
          />
        </div>
      </div>
    );
  }
}


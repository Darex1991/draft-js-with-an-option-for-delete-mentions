import React, { Component } from 'react';
import {
  EditorState,
  SelectionState,
  Modifier,
  convertFromRaw,
} from 'draft-js';

import getRangesForDraftEntity from 'draft-js/lib/getRangesForDraftEntity';
import Editor from 'draft-js-plugins-editor';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
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
      supportWhitespace: true,
      mentionComponent: (mentionProps, b, c, d) => {
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
  }

  delete(event, mentionProps) {
    event.stopPropagation();
    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const selectionKey = selectionState.getAnchorKey();
    const block = contentState.getBlockForKey(selectionKey);
    const blockKey = block.getKey();
    const getBlock = getRangesForDraftEntity(block, mentionProps.entityKey);

    const entitySelection = new SelectionState({
      anchorOffset: getBlock.start,
      anchorKey: blockKey,
      focusOffset: getBlock.end,
      focusKey: blockKey,
      isBackward: false,
      hasFocus: selectionState.getHasFocus(),
    });

    const setEntityPositionFromClickedButton = entitySelection.merge({
      anchorOffset: getBlock[0].start,
      focusOffset: getBlock[0].end,
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
    this.setState({
      suggestions: defaultSuggestionsFilter(value, mentions),
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
        <h1>Hover mention for delete it</h1>
        <div className="editor" onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            className="textarea__field"
            onChange={this.onChange}
            plugins={plugins}
            rows={rows}
            cols={cols}
            ref={element => {
              this.editor = element;
            }}
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

